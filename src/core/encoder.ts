import type { CsvEncoder, CsvOptions, CsvRecord } from '../types';
import type { ResolvedColumn } from './columns';
import { resolveColumns } from './columns';
import type { ResolvedCsvOptions } from './options';
import { resolveOptions } from './options';
import { encodeHeader, encodeRow } from './record';

// U+FEFF byte-order mark, prepended to the output when the `bom` option is set.
const BOM = '﻿';

/**
 * Bridge a user value to the internal record shape. `T extends object` lets
 * callers pass interfaces (which lack an index signature) while the encoder
 * works with a plain keyed record at runtime.
 */
function asRecord(value: unknown): CsvRecord {
  return value as CsvRecord;
}

/** Encode a buffered dataset into the header (when shown) plus one line per record. */
function encodeLines(
  records: readonly CsvRecord[],
  columns: readonly ResolvedColumn[],
  options: ResolvedCsvOptions
): string[] {
  const lines: string[] = [];
  if (options.showHeaders && columns.length > 0) {
    lines.push(encodeHeader(columns, options));
  }
  for (let index = 0; index < records.length; index += 1) {
    lines.push(encodeRow(records[index]!, columns, options, index));
  }
  return lines;
}

/**
 * Create a reusable encoder. Options are resolved once here, so repeated calls
 * do no extra option work. The returned value is callable for the common case
 * and carries `row` and `stream` methods.
 */
export function createCsvEncoder<T extends object = CsvRecord>(
  options: CsvOptions<T> = {}
): CsvEncoder<T> {
  const resolved = resolveOptions(options);
  const declaredColumns = options.columns;

  const stringify = (data: Iterable<T>): string => {
    const records: CsvRecord[] = [];
    for (const record of data) records.push(asRecord(record));

    const columns = resolveColumns(records, declaredColumns);
    const lines = encodeLines(records, columns, resolved);

    let body = lines.join(resolved.newline);
    if (resolved.finalNewline && lines.length > 0) body += resolved.newline;
    return resolved.bom ? `${BOM}${body}` : body;
  };

  const row = (record: T): string => {
    const single = asRecord(record);
    const columns = resolveColumns([single], declaredColumns);
    return encodeRow(single, columns, resolved, 0);
  };

  // With declared columns the header is known up front, so records stream out
  // one at a time. Without them the key union is unknown until every record is
  // seen, so the input is buffered first.
  async function* streamLines(
    data: Iterable<T> | AsyncIterable<T>
  ): AsyncGenerator<string> {
    if (declaredColumns) {
      const columns = resolveColumns([], declaredColumns);
      if (resolved.showHeaders && columns.length > 0) {
        yield encodeHeader(columns, resolved);
      }
      let index = 0;
      for await (const record of data) {
        yield encodeRow(asRecord(record), columns, resolved, index);
        index += 1;
      }
      return;
    }

    const records: CsvRecord[] = [];
    for await (const record of data) records.push(asRecord(record));
    yield* encodeLines(records, resolveColumns(records, undefined), resolved);
  }

  async function* stream(
    data: Iterable<T> | AsyncIterable<T>
  ): AsyncIterable<string> {
    if (resolved.bom) yield BOM;

    let isFirst = true;
    for await (const line of streamLines(data)) {
      yield isFirst ? line : `${resolved.newline}${line}`;
      isFirst = false;
    }
    if (resolved.finalNewline && !isFirst) yield resolved.newline;
  }

  return Object.assign(stringify, { row, stream }) as CsvEncoder<T>;
}
