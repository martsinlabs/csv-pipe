import { CsvPipeError } from '../errors';
import type {
  CsvParsedValue,
  CsvParseOptions,
  CsvParser,
  CsvRecord,
  CsvSource
} from '../types';
import { createRowTokenizer, tokenize } from './tokenize';

/** Returned by the row processor for a row that should not be emitted. */
const SKIP: unique symbol = Symbol('skip');

const LF = 10;
const CR = 13;
// Separator candidates for auto-detection: comma, semicolon, tab, pipe.
const SEPARATOR_CANDIDATES = [44, 59, 9, 124];

function singleCharCode(value: string, name: string): number {
  if (value.length !== 1) {
    throw new CsvPipeError(`The ${name} must be a single character.`);
  }
  return value.charCodeAt(0);
}

/**
 * Coerce field text to a number or boolean, but only when the conversion is
 * lossless (the value round-trips exactly). This keeps `"007"`, `"1.50"`, and
 * `"+1"` as strings, so dynamic typing never silently corrupts data. Only finite
 * numbers are coerced, so `"Infinity"`, `"-Infinity"`, and `"NaN"` stay strings.
 */
function coerce(value: string): CsvParsedValue {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.length > 0) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && String(asNumber) === value)
      return asNumber;
  }
  return value;
}

function isBlank(row: readonly string[]): boolean {
  return row.length === 1 && row[0] === '';
}

function isWhitespace(row: readonly string[]): boolean {
  for (const field of row) if (field.trim() !== '') return false;
  return true;
}

/** Pick the separator with the most occurrences in the first row of `sample`. */
function detectSeparator(sample: string, quoteCode: number): number {
  const counts = [0, 0, 0, 0];
  let inQuotes = false;
  for (let index = 0; index < sample.length; index += 1) {
    const code = sample.charCodeAt(index);
    if (code === quoteCode) {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (code === LF || code === CR) break;
    const candidate = SEPARATOR_CANDIDATES.indexOf(code);
    if (candidate >= 0) counts[candidate] = counts[candidate]! + 1;
  }
  let best = 0;
  for (let index = 1; index < SEPARATOR_CANDIDATES.length; index += 1) {
    if (counts[index]! > counts[best]!) best = index;
  }
  return counts[best]! > 0
    ? SEPARATOR_CANDIDATES[best]!
    : SEPARATOR_CANDIDATES[0]!;
}

function hasRowBreakOutsideQuotes(text: string, quoteCode: number): boolean {
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code === quoteCode) inQuotes = !inQuotes;
    else if (!inQuotes && (code === LF || code === CR)) return true;
  }
  return false;
}

/**
 * Normalize any accepted source into a stream of decoded string chunks. When
 * `ignoreBom` is true a leading byte-order mark is preserved; otherwise the
 * decoder strips it, matching the `bom` option for byte sources.
 */
async function* toChunks(
  source: CsvSource,
  ignoreBom: boolean
): AsyncIterable<string> {
  if (typeof source === 'string') {
    yield source;
    return;
  }

  const decoder = new TextDecoder('utf-8', { ignoreBOM: ignoreBom });
  const maybeStream = source as ReadableStream<string | Uint8Array>;
  if (typeof maybeStream.getReader === 'function') {
    const reader = maybeStream.getReader();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value === undefined) continue;
        yield typeof value === 'string'
          ? value
          : decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
    const tail = decoder.decode();
    if (tail) yield tail;
    return;
  }

  for await (const chunk of source as AsyncIterable<string | Uint8Array>) {
    yield typeof chunk === 'string'
      ? chunk
      : decoder.decode(chunk, { stream: true });
  }
  const tail = decoder.decode();
  if (tail) yield tail;
}

/**
 * Create a reusable parser. Options are resolved once here, so repeated calls do
 * no extra option work. The returned value is callable with CSV text and has a
 * `stream` method for chunked input.
 */
export function createCsvParser(
  options: CsvParseOptions & { header: false; columns?: undefined }
): CsvParser<string[]>;
export function createCsvParser<T = CsvRecord>(
  options?: CsvParseOptions<T>
): CsvParser<T>;
export function createCsvParser<T = CsvRecord>(
  options: CsvParseOptions<T> = {}
): CsvParser<T> {
  const header = options.header ?? true;
  const autoSeparator = options.separator === 'auto';
  const separatorCode = autoSeparator
    ? SEPARATOR_CANDIDATES[0]!
    : singleCharCode(options.separator ?? ',', 'separator');
  const quoteCode = singleCharCode(options.quote ?? '"', 'quote');
  const skipEmptyLines = options.skipEmptyLines ?? true;
  const greedy = skipEmptyLines === 'greedy';
  const skipEmpty = skipEmptyLines !== false;
  const comment = options.comment;
  const trim = options.trim ?? false;
  const stripBom = options.bom !== false;
  const dynamicTyping = options.dynamicTyping ?? false;
  const strict = options.strict ?? false;
  const maxRows = options.maxRows ?? Infinity;
  const rowMapper = options.row;

  const columns = options.columns;
  const positionalKeys = Array.isArray(columns)
    ? (columns as readonly string[])
    : undefined;
  const renameMap =
    columns && !positionalKeys
      ? (columns as Record<string, string | undefined>)
      : undefined;
  if (renameMap && !header) {
    throw new CsvPipeError('A columns rename map requires header: true.');
  }

  const shouldSkip = (row: readonly string[]): boolean => {
    if (
      comment !== undefined &&
      row.length > 0 &&
      row[0]!.startsWith(comment)
    ) {
      return true;
    }
    if (!skipEmpty) return false;
    return greedy ? isWhitespace(row) : isBlank(row);
  };

  // A stateful per-row processor shared by the sync and streaming paths, so both
  // apply identical header, columns, skipping, typing, and validation logic.
  function makeProcessor(): (row: string[]) => T | typeof SKIP {
    let keys: (string | undefined)[] | undefined = positionalKeys
      ? (positionalKeys as string[])
      : undefined;
    let headerPending = header;
    let rowIndex = 0;

    return (row: string[]): T | typeof SKIP => {
      if (trim) {
        for (let index = 0; index < row.length; index += 1) {
          row[index] = row[index]!.trim();
        }
      }
      if (shouldSkip(row)) return SKIP;

      if (headerPending) {
        headerPending = false;
        if (renameMap) keys = row.map((label) => renameMap[label]);
        else if (!positionalKeys) keys = row;
        return SKIP; // the header row is never emitted
      }

      if (keys === undefined) {
        return (dynamicTyping ? row.map(coerce) : row) as T;
      }

      if (strict && row.length !== keys.length) {
        throw new CsvPipeError(
          `Row ${rowIndex} has ${row.length} fields, expected ${keys.length}.`
        );
      }
      const record: CsvRecord = {};
      for (let column = 0; column < keys.length; column += 1) {
        const key = keys[column];
        if (key === undefined) continue;
        const raw = column < row.length ? row[column]! : '';
        record[key] = dynamicTyping ? coerce(raw) : raw;
      }
      rowIndex += 1;
      return rowMapper
        ? rowMapper(record, { rowIndex: rowIndex - 1 })
        : (record as T);
    };
  }

  const parseString = (input: string): T[] => {
    if (maxRows <= 0) return [];
    let text = input;
    if (stripBom && text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const separator = autoSeparator
      ? detectSeparator(text, quoteCode)
      : separatorCode;

    const process = makeProcessor();
    const records: T[] = [];
    for (const row of tokenize(text, separator, quoteCode)) {
      const result = process(row);
      if (result !== SKIP) {
        records.push(result);
        if (records.length >= maxRows) break;
      }
    }
    return records;
  };

  async function* stream(source: CsvSource): AsyncIterable<T> {
    if (maxRows <= 0) return;
    const process = makeProcessor();
    const iterator = toChunks(source, !stripBom)[Symbol.asyncIterator]();
    let count = 0;
    let separator = separatorCode;
    let bomPending = stripBom;
    let buffered = '';

    const stripFirst = (chunk: string): string => {
      if (!bomPending) return chunk;
      bomPending = false;
      return chunk.charCodeAt(0) === 0xfeff ? chunk.slice(1) : chunk;
    };

    // Detect the separator from the first row before building the tokenizer.
    if (autoSeparator) {
      for (;;) {
        const { value, done } = await iterator.next();
        if (done) break;
        buffered += stripFirst(value);
        if (hasRowBreakOutsideQuotes(buffered, quoteCode)) break;
      }
      separator = detectSeparator(buffered, quoteCode);
    }

    const tokenizer = createRowTokenizer(separator, quoteCode);
    const drain = function* (rows: string[][]): Generator<T> {
      for (const row of rows) {
        const result = process(row);
        if (result !== SKIP) yield result;
      }
    };

    if (buffered) {
      for (const record of drain(tokenizer.push(buffered))) {
        yield record;
        if (++count >= maxRows) return;
      }
    }
    for (;;) {
      const { value, done } = await iterator.next();
      if (done) break;
      for (const record of drain(tokenizer.push(stripFirst(value)))) {
        yield record;
        if (++count >= maxRows) return;
      }
    }
    for (const record of drain(tokenizer.end())) {
      yield record;
      if (++count >= maxRows) return;
    }
  }

  return Object.assign(parseString, { stream }) as CsvParser<T>;
}
