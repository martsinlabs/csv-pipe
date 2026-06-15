// Competitive benchmark gate for CI. Fails the build if csv-pipe is not the
// fastest parser by a clear margin, or drops below par with the fastest encoder.
// The thresholds are deliberately wide so normal CI-runner noise never flakes
// the gate; they guard the headline claim, not micro-deltas. Run after a build,
// because it imports the bundled dist.
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import Papa from 'papaparse';
import { Bench } from 'tinybench';
import { parse, stringify } from '../dist/index.js';

// csv-pipe must beat the fastest competitor by at least this much at parsing.
const PARSE_MIN_RATIO = 1.5;
// csv-pipe must stay at least this fraction of the fastest competitor at
// encoding (1.0 = exactly as fast). Below 1.0 allows for a near-tie plus noise.
const ENCODE_MIN_RATIO = 0.95;

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

const rows = makeRows(5000, 4);
const csv = stringify(rows);

const hz = (bench, name) =>
  bench.tasks.find((t) => t.name === name).result.throughput.mean;

const encode = new Bench({ time: 500 });
encode
  .add('csv-pipe', () => stringify(rows))
  .add('papaparse', () => Papa.unparse(rows))
  .add('csv-stringify', () => csvStringify(rows, { header: true }));

const decode = new Bench({ time: 500 });
decode
  .add('csv-pipe', () => parse(csv))
  .add('papaparse', () => Papa.parse(csv, { header: true }))
  .add('csv-parse', () => csvParse(csv, { columns: true }));

await encode.run();
await decode.run();

const encodePipe = hz(encode, 'csv-pipe');
const encodeBest = Math.max(
  hz(encode, 'papaparse'),
  hz(encode, 'csv-stringify')
);
const decodePipe = hz(decode, 'csv-pipe');
const decodeBest = Math.max(hz(decode, 'papaparse'), hz(decode, 'csv-parse'));

// Never let an unreadable result pass silently: NaN comparisons are always
// false, which would make every threshold check trivially "succeed".
for (const [label, value] of [
  ['encode csv-pipe', encodePipe],
  ['encode best competitor', encodeBest],
  ['parse csv-pipe', decodePipe],
  ['parse best competitor', decodeBest]
]) {
  if (!Number.isFinite(value) || value <= 0) {
    console.error(
      `Benchmark gate: could not read throughput for ${label}: ${value}`
    );
    process.exit(1);
  }
}

const encodeRatio = encodePipe / encodeBest;
const decodeRatio = decodePipe / decodeBest;

const round = (n) => Math.round(n * 100) / 100;
console.log(
  `encode: csv-pipe is ${round(encodeRatio)}x the fastest competitor`
);
console.log(
  `parse:  csv-pipe is ${round(decodeRatio)}x the fastest competitor`
);

const failures = [];
if (decodeRatio < PARSE_MIN_RATIO) {
  failures.push(
    `parse: csv-pipe is only ${round(decodeRatio)}x the fastest competitor (need >= ${PARSE_MIN_RATIO}x)`
  );
}
if (encodeRatio < ENCODE_MIN_RATIO) {
  failures.push(
    `encode: csv-pipe is only ${round(encodeRatio)}x the fastest competitor (need >= ${ENCODE_MIN_RATIO}x)`
  );
}

if (failures.length > 0) {
  console.error('\nBenchmark gate failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  '\nbench gate OK: csv-pipe leads parsing and is on par or ahead at encoding'
);
