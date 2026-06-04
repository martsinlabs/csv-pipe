import { stringify as csvStringify } from 'csv-stringify/sync';
import { writeToString } from 'fast-csv';
import Papa from 'papaparse';
import { bench, describe } from 'vitest';
import { stringify } from '../src/index';

type Row = Record<string, string | number>;

function makeRows(count: number, columns: number): Row[] {
  const keys = Array.from({ length: columns }, (_, index) => `col${index}`);
  const rows: Row[] = [];
  for (let row = 0; row < count; row += 1) {
    const record: Row = {};
    for (let column = 0; column < columns; column += 1) {
      record[keys[column]!] =
        column % 2 === 0 ? `value ${row}-${column}` : row * column;
    }
    rows.push(record);
  }
  return rows;
}

function makeQuoteHeavyRows(count: number): Row[] {
  const rows: Row[] = [];
  for (let row = 0; row < count; row += 1) {
    rows.push({
      name: `Last, First ${row}`,
      note: `He said "hello"\nthen left`,
      city: 'a,b,c'
    });
  }
  return rows;
}

const datasets: ReadonlyArray<readonly [string, Row[]]> = [
  ['small (1k x 3)', makeRows(1_000, 3)],
  ['wide (1k x 20)', makeRows(1_000, 20)],
  ['large (50k x 3)', makeRows(50_000, 3)],
  ['quote-heavy (5k x 3)', makeQuoteHeavyRows(5_000)]
];

for (const [name, rows] of datasets) {
  describe(name, () => {
    bench('csv-pipe', () => {
      stringify(rows);
    });
    bench('papaparse', () => {
      Papa.unparse(rows);
    });
    bench('csv-stringify', () => {
      csvStringify(rows, { header: true });
    });
    bench('fast-csv', async () => {
      await writeToString(rows, { headers: true });
    });
  });
}
