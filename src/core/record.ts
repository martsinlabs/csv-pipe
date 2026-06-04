import type { CsvRecord } from '../types';
import type { ResolvedColumn } from './columns';
import { encodeField } from './encode';
import type { ResolvedCsvOptions } from './options';

/** Encode the header line from the resolved column labels. */
export function encodeHeader(
  columns: readonly ResolvedColumn[],
  options: ResolvedCsvOptions
): string {
  return columns
    .map((column) => encodeField(column.header, options))
    .join(options.separator);
}

/** Encode one record into a CSV line by reading each resolved column's key. */
export function encodeRow(
  record: CsvRecord,
  columns: readonly ResolvedColumn[],
  options: ResolvedCsvOptions
): string {
  return columns
    .map((column) => encodeField(record[column.key], options))
    .join(options.separator);
}
