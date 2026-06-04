import type { CsvEncoder, CsvOptions, CsvRecord } from '../types';
import type { ResolvedColumn } from './columns';
import { resolveColumns } from './columns';
import type { ResolvedCsvOptions } from './options';
import { resolveOptions } from './options';
import { encodeHeader, encodeRow } from './record';

const BOM = '﻿';

/**
 * Bridge a user value to the internal record shape. `T extends object` lets
 * callers pass interfaces (which lack an index signature), while the encoder
 * works with a plain keyed record at runtime.
 */
function asRecord(value: unknown): CsvRecord {
  return value as CsvRecord;
}

/** Yield the header line (when shown) followed by one line per record. */
function* generateLines(
  records: readonly CsvRecord[],
  columns: readonly ResolvedColumn[],
  options: ResolvedCsvOptions
): Generator<string> {
  if (options.showHeaders && columns.length > 0) {
    yield encodeHeader(columns, options);
  }
  for (let index = 0; index < records.length; index += 1) {
    yield encodeRow(records[index]!, columns, options, index);
  }
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
    const body = [...generateLines(records, columns, resolved)].join(
      resolved.newline
    );
    return resolved.bom ? `${BOM}${body}` : body;
  };

  const row = (record: T): string => {
    const single = asRecord(record);
    const columns = resolveColumns([single], declaredColumns);
    return encodeRow(single, columns, resolved, 0);
  };

  // Yield unframed lines. With declared columns this is fully incremental: the
  // header is known up front, so records are read and emitted one at a time.
  // Without declared columns the key union is unknown until every record is
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
    const columns = resolveColumns(records, undefined);
    yield* generateLines(records, columns, resolved);
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
  }

  return Object.assign(stringify, { row, stream }) as CsvEncoder<T>;
}
