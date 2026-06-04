import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createCsvEncoder } from '../core/encoder';
import type { CsvOptions } from '../types';

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
