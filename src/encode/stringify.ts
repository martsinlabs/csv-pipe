import { createCsvEncoder } from '../core/encoder';
import type { CsvOptions } from '../types';

/**
 * Encode a dataset into a single CSV string.
 *
 * This is sugar over {@link createCsvEncoder}: `stringify(data, options)` equals
 * `createCsvEncoder(options)(data)`. Pure and deterministic.
 */
export function stringify<T extends object>(
  data: readonly T[],
  options: CsvOptions<T> = {}
): string {
  return createCsvEncoder<T>(options)(data);
}
