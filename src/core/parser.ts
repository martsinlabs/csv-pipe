import { assertSingleChar, CsvPipeError } from '../errors';
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
  assertSingleChar(value, name);
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

/**
 * Whether a physical line is ignored when detecting the separator, so leading
 * blank or comment lines never decide the delimiter. Mirrors the parser's own
 * skip rules for the common (untrimmed) case.
 */
function isSkippableLine(
  line: string,
  skipEmpty: boolean,
  greedy: boolean,
  comment: string | undefined
): boolean {
  if (comment !== undefined && line.startsWith(comment)) return true;
  if (!skipEmpty) return false;
  return greedy ? line.trim() === '' : line === '';
}

/**
 * Count separator candidates outside quotes in one line and return the most
 * frequent. Falls back to comma when the line holds none (a single-column line).
 */
function countSeparators(line: string, quoteCode: number): number {
  const counts = [0, 0, 0, 0];
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const code = line.charCodeAt(index);
    if (code === quoteCode) {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
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

/**
 * Detect the separator from the first line that is neither blank nor a comment,
 * so metadata or blank lines above the header never skew the result. Candidates
 * are comma, semicolon, tab, and pipe; any inside quotes are ignored.
 *
 * Returns `null` when no usable line is available yet. With `requireComplete` a
 * line counts only once a row break closes it, which lets the streaming path
 * keep buffering until it has a full line to judge.
 */
function detectSeparator(
  sample: string,
  quoteCode: number,
  skipEmpty: boolean,
  greedy: boolean,
  comment: string | undefined,
  requireComplete: boolean
): number | null {
  const length = sample.length;
  let lineStart = 0;
  let inQuotes = false;
  let index = 0;
  while (index < length) {
    const code = sample.charCodeAt(index);
    if (code === quoteCode) {
      inQuotes = !inQuotes;
      index += 1;
      continue;
    }
    if (!inQuotes && (code === LF || code === CR)) {
      const line = sample.slice(lineStart, index);
      if (!isSkippableLine(line, skipEmpty, greedy, comment)) {
        return countSeparators(line, quoteCode);
      }
      if (code === CR && sample.charCodeAt(index + 1) === LF) index += 1;
      index += 1;
      lineStart = index;
      continue;
    }
    index += 1;
  }
  // The trailing line has no closing break. Judge it only when the caller holds
  // the whole input (sync), not mid-stream where more may still arrive.
  if (!requireComplete && !inQuotes) {
    const line = sample.slice(lineStart);
    if (!isSkippableLine(line, skipEmpty, greedy, comment)) {
      return countSeparators(line, quoteCode);
    }
  }
  return null;
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
    let drained = false;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          drained = true;
          break;
        }
        if (value === undefined) continue;
        yield typeof value === 'string'
          ? value
          : decoder.decode(value, { stream: true });
      }
    } finally {
      // On early exit (the consumer stopped, or maxRows was reached) cancel the
      // stream so the underlying source is released, not merely unlocked.
      if (!drained) await reader.cancel().catch(() => {});
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
    let sourceRow = 0;

    return (row: string[]): T | typeof SKIP => {
      sourceRow += 1;
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
          `Row ${sourceRow} has ${row.length} fields, expected ${keys.length}.`
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
      ? (detectSeparator(text, quoteCode, skipEmpty, greedy, comment, false) ??
        SEPARATOR_CANDIDATES[0]!)
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
    // Close the source on any exit, including an early `return` here or the
    // consumer breaking out, so a file handle or stream reader never leaks.
    try {
      let count = 0;
      let separator = separatorCode;
      let bomPending = stripBom;
      let buffered = '';

      const stripFirst = (chunk: string): string => {
        if (!bomPending) return chunk;
        bomPending = false;
        return chunk.charCodeAt(0) === 0xfeff ? chunk.slice(1) : chunk;
      };

      // Detect the separator before building the tokenizer, buffering chunks
      // until the first non-blank, non-comment line is complete enough to judge.
      if (autoSeparator) {
        let detected: number | null = null;
        for (;;) {
          const { value, done } = await iterator.next();
          if (done) {
            detected = detectSeparator(
              buffered,
              quoteCode,
              skipEmpty,
              greedy,
              comment,
              false
            );
            break;
          }
          buffered += stripFirst(value);
          detected = detectSeparator(
            buffered,
            quoteCode,
            skipEmpty,
            greedy,
            comment,
            true
          );
          if (detected !== null) break;
        }
        separator = detected ?? SEPARATOR_CANDIDATES[0]!;
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
    } finally {
      await iterator.return?.();
    }
  }

  return Object.assign(parseString, { stream }) as CsvParser<T>;
}
