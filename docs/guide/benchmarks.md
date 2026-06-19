---
description: csv-pipe is the fastest common CSV parser, and matches or beats the other libraries at encoding.
---

# Benchmarks

csv-pipe is the fastest of the common CSV libraries at parsing, by a wide margin,
and the fastest or on par at encoding, across every dataset tested.

Throughput is in operations per second, where one operation encodes or parses the
whole dataset (higher is better). On the large dataset that is roughly 7M rows/s
for encoding and 10M rows/s for parsing. These are indicative numbers from one dev
machine; they vary by hardware. Reproduce them with `npm run bench`.

## How it is measured

Each comparison uses the current major of every library (papaparse 5, csv-parse
7, csv-stringify 6, fast-csv 5) on the same data, with headers on and no type
coercion, so the libraries do equivalent work. fast-csv is measured through its
streaming API, since it has no synchronous one. The harness is
[tinybench](https://github.com/tinylibs/tinybench) through Vitest, with warmup
and repeated samples.

## Encoding

Objects to CSV text, against papaparse, csv-stringify, and fast-csv.

| Dataset              | csv-pipe | papaparse | csv-stringify | fast-csv |
| -------------------- | -------- | --------- | ------------- | -------- |
| small (1,000 x 3)    | 9,080    | 5,470     | 5,320         | 1,820    |
| wide (1,000 x 20)    | 1,130    | 737       | 778           | 653      |
| large (50,000 x 3)   | 144      | 99        | 69            | 30       |
| quote-heavy (5k x 3) | 904      | 898       | 570           | 303      |

On encoding, csv-pipe runs about 1.5x faster than papaparse and csv-stringify, and
up to roughly 5x faster than fast-csv. On quote-heavy data it is about on par with
papaparse, and still ahead of csv-stringify and fast-csv.

## Parsing

CSV text to records, against papaparse, csv-parse, and fast-csv.

| Dataset              | csv-pipe | papaparse | csv-parse | fast-csv |
| -------------------- | -------- | --------- | --------- | -------- |
| small (1,000 x 3)    | 13,100   | 2,960     | 1,910     | 870      |
| wide (1,000 x 20)    | 1,460    | 524       | 269       | 177      |
| large (50,000 x 3)   | 201      | 61        | 32        | 16       |
| quote-heavy (5k x 3) | 1,550    | 377       | 248       | 134      |

On parsing, csv-pipe runs about 2.8x to 4.4x faster than papaparse, 5x to 7x
faster than csv-parse, and 8x to 15x faster than fast-csv.

## Why it is fast

- A single pass over the input with `charCodeAt`, no regular expressions on the
  hot path.
- Fields are taken as string slices by index, so clean values do no
  per-character work.
- Options are resolved once per encoder or parser, so repeated calls pay no
  setup cost.

## Tracked over time

Encode and parse throughput are measured on every push to `master` and published
to a [live chart](https://martsinlabs.github.io/csv-pipe/bench/). A pull request
that regresses past the alert threshold fails the run, so a slowdown cannot land
unnoticed.
