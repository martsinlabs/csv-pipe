import { UnsupportedValueError, unsupportedCellError } from '../errors';
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

/**
 * Encode one record into a CSV line by reading each resolved column's key. If a
 * value cannot be encoded, the error names the offending row and column.
 */
export function encodeRow(
  record: CsvRecord,
  columns: readonly ResolvedColumn[],
  options: ResolvedCsvOptions,
  rowIndex: number
): string {
  const { format } = options;
  let key = '';
  try {
    let line = '';
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index]!;
      key = column.key;
      if (index > 0) line += options.separator;
      const raw = record[column.key];
      const value = format ? format(raw, { column: key, rowIndex }) : raw;
      line += encodeField(value, options);
    }
    return line;
  } catch (cause) {
    if (cause instanceof UnsupportedValueError) {
      throw unsupportedCellError(cause.value, key, rowIndex);
    }
    throw cause;
  }
}
