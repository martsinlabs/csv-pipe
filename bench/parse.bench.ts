import { parse as csvParseSync } from 'csv-parse/sync';
import { parseString as fastCsvParse } from 'fast-csv';
import Papa from 'papaparse';
import { bench, describe } from 'vitest';
import { parse, stringify } from '../src/index';

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

function fastCsvCollect(csv: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fastCsvParse(csv, { headers: true })
      .on('data', () => {})
      .on('end', () => resolve())
      .on('error', reject);
  });
}

const datasets: ReadonlyArray<readonly [string, string]> = [
  ['small (1k x 3)', stringify(makeRows(1_000, 3))],
  ['wide (1k x 20)', stringify(makeRows(1_000, 20))],
  ['large (50k x 3)', stringify(makeRows(50_000, 3))],
  ['quote-heavy (5k x 3)', stringify(makeQuoteHeavyRows(5_000))]
];

for (const [name, csv] of datasets) {
  describe(name, () => {
    bench('csv-pipe', () => {
      parse(csv);
    });
    bench('papaparse', () => {
      Papa.parse(csv, { header: true });
    });
    bench('csv-parse', () => {
      csvParseSync(csv, { columns: true });
    });
    bench('fast-csv', async () => {
      await fastCsvCollect(csv);
    });
  });
}
