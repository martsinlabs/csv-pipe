import { createCsvParser } from '../core/parser';
import type { CsvParseOptions, CsvRecord } from '../types';

/**
 * Parse CSV text into records.
 *
 * With the default `header: true`, the first row supplies the keys and each
 * record is an object. Pass `header: false` to get the raw `string[]` of each
 * row instead. This is sugar over {@link createCsvParser}:
 * `parse(text, options)` equals `createCsvParser(options)(text)`.
 */
export function parse(
  input: string,
  options: CsvParseOptions & { header: false; columns?: undefined }
): string[][];
export function parse<T = CsvRecord>(
  input: string,
  options?: CsvParseOptions<T>
): T[];
export function parse<T>(input: string, options: CsvParseOptions<T> = {}): T[] {
  return createCsvParser<T>(options)(input);
}
