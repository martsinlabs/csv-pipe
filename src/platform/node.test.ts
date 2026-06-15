import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stringify } from '../encode/stringify';
import { readCsv, writeCsv } from './node';

/**
 * Allocate a CSV path inside a freshly created private temp directory. `mkdtemp`
 * lets the OS pick the random suffix and creates the directory with 0700
 * permissions, so the file is not exposed to other users of the shared temp dir.
 */
async function tempFile(): Promise<{
  path: string;
  cleanup: () => Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'csv-pipe-'));
  return {
    path: join(dir, 'data.csv'),
    cleanup: () => rm(dir, { recursive: true, force: true })
  };
}

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const value of source) out.push(value);
  return out;
}

describe('writeCsv', () => {
  it('streams encoded CSV to a file', async () => {
    const { path, cleanup } = await tempFile();
    const rows = [
      { name: 'Alex', age: 29 },
      { name: 'Sam', age: 24 }
    ];

    try {
      await writeCsv(path, rows);
      expect(await readFile(path, 'utf8')).toBe(stringify(rows));
    } finally {
      await cleanup();
    }
  });
});

describe('readCsv', () => {
  it('streams parsed records from a file', async () => {
    const { path, cleanup } = await tempFile();
    try {
      await writeFile(path, 'name,age\nAlex,29\nSam,24');
      expect(await collect(readCsv(path))).toEqual([
        { name: 'Alex', age: '29' },
        { name: 'Sam', age: '24' }
      ]);
    } finally {
      await cleanup();
    }
  });

  it('round-trips through writeCsv and readCsv', async () => {
    const { path, cleanup } = await tempFile();
    const rows = [
      { name: 'Alex', city: 'a,b' },
      { name: 'Sam', city: 'x"y' }
    ];
    try {
      await writeCsv(path, rows);
      expect(await collect(readCsv(path))).toEqual(rows);
    } finally {
      await cleanup();
    }
  });
});
