import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stringify } from '../encode/stringify';
import { writeCsv } from './node';

describe('writeCsv', () => {
  it('streams encoded CSV to a file', async () => {
    const path = join(
      tmpdir(),
      `csv-pipe-${Date.now()}-${Math.random().toString(16).slice(2)}.csv`
    );
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
