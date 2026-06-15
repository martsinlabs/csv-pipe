/**
 * Node helpers, imported from `csv-pipe/node`.
 *
 * @module csv-pipe/node
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createCsvEncoder } from '../core/encoder';
import { createCsvParser } from '../core/parser';
import type { CsvOptions, CsvParseOptions, CsvRecord } from '../types';

/**
 * Encode `data` and write it to a file. The encoder streams, so memory stays
 * flat for large inputs. Resolves once the file is fully written.
 */
export async function writeCsv<T extends object>(
  path: string,
  data: Iterable<T> | AsyncIterable<T>,
  options: CsvOptions<T> = {}
): Promise<void> {
  const encoder = createCsvEncoder<T>(options);
  await pipeline(Readable.from(encoder.stream(data)), createWriteStream(path));
}

/**
 * Read and parse a CSV file as a stream of records. The file is read and decoded
 * incrementally, so memory stays flat for files of any size. The mirror of
 * {@link writeCsv}.
 *
 * ```ts
 * for await (const user of readCsv<User>('users.csv')) {
 *   // one record at a time
 * }
 * ```
 */
export function readCsv(
  path: string,
  options: CsvParseOptions & { header: false; columns?: undefined }
): AsyncIterable<string[]>;
export function readCsv<T = CsvRecord>(
  path: string,
  options?: CsvParseOptions<T>
): AsyncIterable<T>;
export function readCsv<T = CsvRecord>(
  path: string,
  options: CsvParseOptions<T> = {}
): AsyncIterable<T> {
  return createCsvParser<T>(options).stream(createReadStream(path));
}
