import { readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stringify } from '../encode/stringify';
import { readCsv, writeCsv } from './node';

function tempPath(): string {
  return join(
    tmpdir(),
    `csv-pipe-${Date.now()}-${Math.random().toString(16).slice(2)}.csv`
  );
}

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const value of source) out.push(value);
  return out;
}

describe('writeCsv', () => {
  it('streams encoded CSV to a file', async () => {
    const path = tempPath();
    const rows = [
      { name: 'Alex', age: 29 },
      { name: 'Sam', age: 24 }
    ];

    try {
      await writeCsv(path, rows);
      expect(await readFile(path, 'utf8')).toBe(stringify(rows));
    } finally {
      await rm(path, { force: true });
    }
  });
});

describe('readCsv', () => {
  it('streams parsed records from a file', async () => {
    const path = tempPath();
    try {
      await writeFile(path, 'name,age\nAlex,29\nSam,24');
      expect(await collect(readCsv(path))).toEqual([
        { name: 'Alex', age: '29' },
        { name: 'Sam', age: '24' }
      ]);
    } finally {
      await rm(path, { force: true });
    }
  });

  it('round-trips through writeCsv and readCsv', async () => {
    const path = tempPath();
    const rows = [
      { name: 'Alex', city: 'a,b' },
      { name: 'Sam', city: 'x"y' }
    ];
    try {
      await writeCsv(path, rows);
      expect(await collect(readCsv(path))).toEqual(rows);
    } finally {
      await rm(path, { force: true });
    }
  });
});
