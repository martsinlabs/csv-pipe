# csv-pipe

[![CI](https://img.shields.io/github/actions/workflow/status/martsinlabs/csv-pipe/ci.yml?branch=master&label=CI)](https://github.com/martsinlabs/csv-pipe/actions/workflows/ci.yml) [![coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fmartsinlabs.github.io%2Fcsv-pipe%2Fcoverage-badge.json)](https://github.com/martsinlabs/csv-pipe/actions/workflows/ci.yml) [![bundle size](https://img.shields.io/endpoint?url=https%3A%2F%2Fmartsinlabs.github.io%2Fcsv-pipe%2Fsize-badge.json)](https://martsinlabs.github.io/csv-pipe/bench/) [![encode throughput](https://img.shields.io/endpoint?url=https%3A%2F%2Fmartsinlabs.github.io%2Fcsv-pipe%2Fbench-badge.json)](https://martsinlabs.github.io/csv-pipe/bench/) [![benchmarks updated](https://img.shields.io/github/last-commit/martsinlabs/csv-pipe/gh-pages?label=benchmarks%20updated)](https://martsinlabs.github.io/csv-pipe/bench/)

A small, fast, zero-dependency CSV encoder for TypeScript and JavaScript. It turns arrays of objects into RFC 4180-compliant CSV and runs in Node, browsers, Deno, Bun, and edge runtimes.

## Highlights

- **Correct by default.** Quoting and escaping follow RFC 4180, so values with commas, quotes, or line breaks round-trip through any standard parser.
- **Fast.** The fastest of the common encoders on every benchmark [below](#benchmarks).
- **Typed.** Column names are checked against your data type, so a typo is a compile error. No `any` in the public surface.
- **Universal.** One platform-neutral core for every runtime, with thin helpers for Node and the browser.
- **Streaming.** Encode large datasets with flat memory.
- **Zero dependencies.** Nothing is added to your bundle.

## Install

```
npm install csv-pipe
```

## Quick start

```ts
import { stringify } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex.johnson@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos.h24@example.com', age: 24 }
];

const csv = stringify(users);
// name,email,age
// Alex Johnson,alex.johnson@example.com,29
// Carlos Herrera,carlos.h24@example.com,24
```

The header comes from the record keys, and a field is quoted only when it contains the separator, a quote, or a line break.

## Choosing columns

One `columns` option selects, orders, and labels columns. Keys are checked against your type, so a typo will not compile.

```ts
// Array of keys: each key is also its header.
stringify(users, { columns: ['name', 'email'] });
// name,email
// Alex Johnson,alex.johnson@example.com

// Map of key to label: also sets the header text.
stringify(users, { columns: { name: 'Full name', email: 'Email address' } });
// Full name,Email address
// Alex Johnson,alex.johnson@example.com
```

Without `columns`, the columns are the stable union of every record's keys, in first-seen order, so reordered or partial records never shift.

## Formatting values

A `Date` renders as an ISO string out of the box. For anything else (custom number formats, nested objects), pass a `format` function. It receives each value and its location, and returns whatever should be encoded; return the value unchanged to pass it through.

```ts
// Round every number to two decimals, and leave other values as they are.
stringify(users, {
  format: (value) => (typeof value === 'number' ? value.toFixed(2) : value)
});
```

## Reusing an encoder

`createCsvEncoder` resolves options once and returns a callable encoder with `row` and `stream`. Use it to encode many datasets with the same configuration.

```ts
import { createCsvEncoder } from 'csv-pipe';

const toCsv = createCsvEncoder<User>({ columns: ['name', 'email'] });

toCsv(users); // the whole document as a string
toCsv.row(users[0]); // one line, without a header
```

`stringify(data, options)` is shorthand for `createCsvEncoder(options)(data)`.

## Streaming

`stream` returns string chunks and accepts a sync or async iterable. With `columns` declared it is fully incremental, reading and emitting one record at a time; without them the input is buffered first, since the header needs every key.

```ts
const toCsv = createCsvEncoder<User>({ columns: ['name', 'email'] });

for await (const chunk of toCsv.stream(users)) {
  // write each chunk to a file, socket, or HTTP response
}
```

Adapt the stream to your runtime:

```ts
import { toReadableStream } from 'csv-pipe';

// Web, Deno, Bun, edge, or Node 18+: a Web ReadableStream.
return new Response(toReadableStream(toCsv.stream(users)), {
  headers: { 'content-type': 'text/csv' }
});

// Node: a classic Readable, via the built-in helper.
import { Readable } from 'node:stream';
const readable = Readable.from(toCsv.stream(users));
```

## Node and browser helpers

The core entry (`csv-pipe`) never imports `fs` or the DOM, so it runs anywhere. Each platform gets a thin helper on its own entry point.

```ts
// Node: stream straight to a file, with flat memory.
import { writeCsv } from 'csv-pipe/node';
await writeCsv('users.csv', users, { columns: ['name', 'email'] });

// Browser: encode, trigger a download, then revoke the object URL.
import { downloadCsv } from 'csv-pipe/browser';
downloadCsv(users, { filename: 'users.csv' });
```

## Options

Every option is optional.

| Option           | Type                                       | Default                            | Description                                                                                          |
| ---------------- | ------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `columns`        | `(keyof T)[]` or `Record<keyof T, string>` | union of record keys               | Columns to emit: an array of keys, or a map of key to header label.                                  |
| `showHeaders`    | `boolean`                                  | `true`                             | Whether to emit a header row.                                                                        |
| `separator`      | `string`                                   | `,`                                | Field separator.                                                                                     |
| `quote`          | `string`                                   | `"`                                | Quote character used when a field must be quoted.                                                    |
| `newline`        | `string`                                   | `\r\n`                             | Line terminator between records.                                                                     |
| `finalNewline`   | `boolean`                                  | `false`                            | Append a trailing newline after the last record.                                                     |
| `quoting`        | `'minimal' \| 'all' \| 'non-numeric'`      | `minimal`                          | `minimal` quotes only when required; `all` quotes every field; `non-numeric` quotes all but numbers. |
| `format`         | `(value, context) => unknown`              | none                               | Transform each value before it is encoded.                                                           |
| `nullText`       | `string`                                   | `""`                               | Text for `null`.                                                                                     |
| `undefinedText`  | `string`                                   | `""`                               | Text for `undefined`.                                                                                |
| `nanText`        | `string`                                   | `""`                               | Text for `NaN`.                                                                                      |
| `infinityText`   | `string`                                   | `Infinity`                         | Text for `Infinity`; `-Infinity` becomes `-` followed by this.                                       |
| `booleans`       | `{ true: string; false: string }`          | `{ true: 'true', false: 'false' }` | Text for boolean values.                                                                             |
| `arraySeparator` | `string`                                   | `, `                               | Separator used to join an array within a single cell.                                                |
| `bom`            | `boolean`                                  | `false`                            | Prepend a UTF-8 byte-order mark, which helps some spreadsheet apps.                                  |

## Behavior

- A quoted field escapes an embedded quote by doubling it, per RFC 4180.
- `null`, `undefined`, and `NaN` render as an empty string by default.
- A missing key and an explicit `undefined` are treated the same.
- An array value is joined into one cell using `arraySeparator`.
- A `Date` renders as an ISO 8601 string.
- A value that cannot be a cell (a plain object, function, or symbol) throws a `CsvPipeError` that names the row and column. Use `format` to handle such values.

## TypeScript

```ts
import type { CsvOptions, CsvRecord } from 'csv-pipe';
```

Exported types: `CsvOptions`, `CsvColumns`, `CsvEncoder`, `CsvRecord`, `CsvInput`, `CsvCell`, `CsvPrimitive`, `QuotingMode`, and `BooleanStyle`, plus the `CsvPipeError` class.

## Benchmarks

Encoding throughput against common libraries, in operations per second (higher is better). These are indicative numbers from one dev machine on Node 24 and vary by hardware. Reproduce with `npm run bench`.

| Dataset              | csv-pipe | papaparse | csv-stringify | fast-csv |
| -------------------- | -------- | --------- | ------------- | -------- |
| small (1,000 x 3)    | 9,080    | 5,470     | 5,320         | 1,820    |
| wide (1,000 x 20)    | 1,130    | 737       | 778           | 653      |
| large (50,000 x 3)   | 144      | 99        | 69            | 30       |
| quote-heavy (5k x 3) | 904      | 898       | 570           | 303      |

csv-pipe leads by about 1.5x on the small, wide, and large datasets, and edges papaparse on heavily quoted data (a near tie). It encodes in a tight loop and precompiles its quote test and escape, so the per-cell path stays minimal.

The figure is also tracked over time on a [live chart](https://martsinlabs.github.io/csv-pipe/bench/): CI publishes it on every push to `master` and flags a pull request that regresses. The badges at the top of this page read from that data, so the throughput and last-updated date always reflect the latest run. Generate the data locally with `npm run build && npm run bench:track`.

## License

MIT (c) Martsin Labs. See [LICENSE](LICENSE).
