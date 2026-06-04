import type { CsvColumns, CsvEncoder, CsvOptions, CsvRecord } from '../types';
import { resolveColumns } from './columns';
import type { ResolvedCsvOptions } from './options';
import { resolveOptions } from './options';
import { encodeHeader, encodeRow } from './record';

const BOM = '﻿';

/** Yield the header line (when shown) followed by one line per record. */
function* generateLines<T>(
  records: readonly CsvRecord[],
  declaredColumns: CsvColumns<T> | undefined,
  options: ResolvedCsvOptions
): Generator<string> {
  const columns = resolveColumns(records, declaredColumns);

  if (options.showHeaders && columns.length > 0) {
    yield encodeHeader(columns, options);
  }

  for (const record of records) {
    yield encodeRow(record, columns, options);
  }
}

/**
 * Bridge user data to the internal record shape. `T extends object` lets callers
 * pass interfaces (which lack an index signature), while the encoder works with
 * a plain keyed record at runtime.
 */
function toRecords<T>(data: Iterable<T>): readonly CsvRecord[] {
  const list: readonly unknown[] = Array.isArray(data) ? data : [...data];
  return list as readonly CsvRecord[];
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
    const lines = [
      ...generateLines(toRecords(data), declaredColumns, resolved)
    ];
    const body = lines.join(resolved.newline);
    return resolved.bom ? `${BOM}${body}` : body;
  };

  const row = (record: T): string => {
    const records = toRecords([record]);
    const columns = resolveColumns(records, declaredColumns);
    return encodeRow(records[0]!, columns, resolved);
  };

  async function* stream(
    data: Iterable<T> | AsyncIterable<T>
  ): AsyncIterable<string> {
    const collected: T[] = [];
    for await (const record of data) collected.push(record);
    const records = toRecords(collected);

    if (resolved.bom) yield BOM;

    let isFirst = true;
    for (const line of generateLines(records, declaredColumns, resolved)) {
      yield isFirst ? line : `${resolved.newline}${line}`;
      isFirst = false;
    }
  }

  return Object.assign(stringify, { row, stream }) as CsvEncoder<T>;
}
