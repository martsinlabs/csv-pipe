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
  let key = '';
  try {
    const cells: string[] = [];
    for (const column of columns) {
      key = column.key;
      cells.push(encodeField(record[column.key], options));
    }
    return cells.join(options.separator);
  } catch (cause) {
    if (cause instanceof UnsupportedValueError) {
      throw unsupportedCellError(cause.value, key, rowIndex);
    }
    throw cause;
  }
}
