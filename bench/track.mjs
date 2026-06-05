// Measures csv-pipe's own encode and parse throughput and writes results in the
// github-action-benchmark "customBiggerIsBetter" format for regression tracking.
// Run after a build: `npm run build && node bench/track.mjs`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Bench } from 'tinybench';
import { parse, stringify } from '../dist/index.js';

function makeRows(count, columns) {
  const keys = Array.from({ length: columns }, (_, index) => `col${index}`);
  const rows = [];
  for (let row = 0; row < count; row += 1) {
    const record = {};
    for (let column = 0; column < columns; column += 1) {
      record[keys[column]] =
        column % 2 === 0 ? `value ${row}-${column}` : row * column;
    }
    rows.push(record);
  }
  return rows;
}

function makeQuoteHeavyRows(count) {
  const rows = [];
  for (let row = 0; row < count; row += 1) {
    rows.push({
      name: `Last, First ${row}`,
      note: `He said "hello"\nthen left`,
      city: 'a,b,c'
    });
  }
  return rows;
}

const datasets = [
  ['small (1k x 3)', makeRows(1_000, 3)],
  ['wide (1k x 20)', makeRows(1_000, 20)],
  ['large (50k x 3)', makeRows(50_000, 3)],
  ['quote-heavy (5k x 3)', makeQuoteHeavyRows(5_000)]
];

const rowCountByDataset = new Map(
  datasets.map(([name, rows]) => [name, rows.length])
);
// CSV inputs for the parse benchmarks, produced by the encoder.
const csvByDataset = new Map(
  datasets.map(([name, rows]) => [name, stringify(rows)])
);

const bench = new Bench({ time: 500 });
for (const [name, rows] of datasets) {
  bench.add(`encode: ${name}`, () => {
    stringify(rows);
  });
}
for (const [name] of datasets) {
  const csv = csvByDataset.get(name);
  bench.add(`parse: ${name}`, () => {
    parse(csv);
  });
}

await bench.run();

const results = bench.tasks.map((task) => ({
  name: task.name,
  unit: 'ops/sec',
  value: Math.round(task.result.throughput.mean)
}));

// Headline figure for a badge: rows per second on the large dataset (the most
// representative throughput), for both directions.
function headline(direction, label) {
  const task = results.find(
    (result) => result.name === `${direction}: large (50k x 3)`
  );
  const datasetRows = rowCountByDataset.get('large (50k x 3)') ?? 0;
  const rowsPerSecond = (task?.value ?? 0) * datasetRows;
  return {
    schemaVersion: 1,
    label,
    message: `${(rowsPerSecond / 1e6).toFixed(1)}M rows/s`,
    color: 'brightgreen'
  };
}

const encodeBadge = headline('encode', 'encode');
const parseBadge = headline('parse', 'parse');

// Outputs go to public/, the gitignored directory that is published to gh-pages.
mkdirSync('public', { recursive: true });
writeFileSync('public/bench-results.json', JSON.stringify(results, null, 2));
writeFileSync('public/encode-badge.json', JSON.stringify(encodeBadge, null, 2));
writeFileSync('public/parse-badge.json', JSON.stringify(parseBadge, null, 2));
console.log(JSON.stringify({ results, encodeBadge, parseBadge }, null, 2));
