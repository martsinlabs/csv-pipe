// Measures csv-pipe's own encoding throughput and writes results in the
// github-action-benchmark "customBiggerIsBetter" format for regression tracking.
// Run after a build: `npm run build && node bench/track.mjs`.
import { writeFileSync } from 'node:fs';
import { Bench } from 'tinybench';
import { stringify } from '../dist/index.js';

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

const rowCountByName = new Map(
  datasets.map(([name, rows]) => [name, rows.length])
);

const bench = new Bench({ time: 500 });
for (const [name, rows] of datasets) {
  bench.add(name, () => {
    stringify(rows);
  });
}

await bench.run();

const results = bench.tasks.map((task) => ({
  name: task.name,
  unit: 'ops/sec',
  value: Math.round(task.result.throughput.mean)
}));

// Headline figure for the README badge: rows encoded per second on the large
// dataset, which is the most representative throughput number.
const large = results.find((result) => result.name.startsWith('large'));
const rowsPerSecond =
  (large?.value ?? 0) * (rowCountByName.get(large?.name) ?? 0);
const badge = {
  schemaVersion: 1,
  label: 'encode',
  message: `${(rowsPerSecond / 1e6).toFixed(1)}M rows/s`,
  color: 'brightgreen'
};

writeFileSync('bench-results.json', JSON.stringify(results, null, 2));
writeFileSync('bench-badge.json', JSON.stringify(badge, null, 2));
console.log(JSON.stringify({ results, badge }, null, 2));
