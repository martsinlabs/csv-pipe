# csv-pipe

A small, fast, zero-dependency CSV encoder for TypeScript and JavaScript. It converts arrays of objects into RFC 4180-compliant CSV and runs in Node, browsers, Deno, Bun, and edge runtimes.

> Status: 2.0.0 alpha. The core API is `stringify` and `createCsvEncoder` (callable, with `row` and `stream`). Platform helpers live in `csv-pipe/browser` (download) and `csv-pipe/node` (file writing).

## Why csv-pipe

- Correct by default. Quotes and escaping follow RFC 4180, so values containing commas, quotes, or newlines round-trip through any standard parser.
- Deterministic. The same input and options always produce the same output. There is no hidden state.
- Typed. First-class TypeScript types, no `any` in the public surface.
- Zero dependencies. Nothing is pulled into your bundle.

## Installation

```
npm install csv-pipe
```

## Usage

```typescript
import { stringify } from 'csv-pipe';

const users = [
  { name: 'Alex Johnson', email: 'alex.johnson@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos.h24@example.com', age: 24 }
];

const csv = stringify(users);
// name,email,age
// Alex Johnson,alex.johnson@example.com,29
// Carlos Herrera,carlos.h24@example.com,24
```

By default the header row is derived from the record keys, and each field is quoted only when it contains the separator, a quote, a carriage return, or a line feed.

### Choosing, ordering, and labelling columns

The `columns` option does all three. Pass an array of keys, or a map of key to header label. Keys are checked against your data type, so a typo is a compile error.

```typescript
// Array: select and order; the key is also the header.
stringify(users, { columns: ['name', 'email'] });
// name,email
// Alex Johnson,alex.johnson@example.com

// Map: select, order, and label.
stringify(users, { columns: { name: 'Full name', email: 'Email address' } });
// Full name,Email address
// Alex Johnson,alex.johnson@example.com
```

When `columns` is omitted, the columns are the stable union of every record's keys in first-seen order, so records with reordered or missing keys never shift columns.

### Reusing an encoder

`createCsvEncoder` resolves options once and returns a callable encoder with `row` and `stream` methods. Use it when you encode many datasets with the same configuration.

```typescript
import { createCsvEncoder } from 'csv-pipe';

const toCsv = createCsvEncoder<User>({ columns: ['name', 'email'] });

toCsv(users); // full document as a string
toCsv.row(users[0]); // a single line, no header
```

### Streaming

`stream` yields string chunks and accepts a sync or async iterable, which suits large datasets and backpressure-aware writers. When `columns` are declared it is fully incremental: records are read and emitted one at a time. Without declared columns the input is buffered first, since the header needs every key.

```typescript
const toCsv = createCsvEncoder<User>({ columns: ['name', 'email'] });

for await (const chunk of toCsv.stream(users)) {
  // write each chunk to a file, socket, or HTTP response
}
```

Adapt the stream to the primitive your runtime expects:

```typescript
import { toReadableStream } from 'csv-pipe';

// Web, Deno, Bun, edge, or Node 18+: a Web ReadableStream.
const body = toReadableStream(toCsv.stream(users));
return new Response(body, { headers: { 'content-type': 'text/csv' } });

// Node: a classic Readable, using the built-in helper.
import { Readable } from 'node:stream';
const readable = Readable.from(toCsv.stream(users));
```

### Writing a file in Node

`csv-pipe/node` streams the encoder straight to disk, so memory stays flat for large datasets.

```typescript
import { writeCsv } from 'csv-pipe/node';

await writeCsv('users.csv', users, { columns: ['name', 'email'] });
```

### Downloading in the browser

`csv-pipe/browser` encodes and triggers a download, then revokes the object URL.

```typescript
import { downloadCsv } from 'csv-pipe/browser';

downloadCsv(users, { filename: 'users.csv' });
```

The core entry (`csv-pipe`) stays platform-neutral, so it never pulls in `fs` or the DOM and runs anywhere.

## Options

All options are optional.

| Option           | Type                                       | Default                            | Description                                                                |
| ---------------- | ------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------- |
| `separator`      | `string`                                   | `,`                                | Field separator.                                                           |
| `quote`          | `string`                                   | `"`                                | Quote character used when a field must be quoted.                          |
| `newline`        | `string`                                   | `\r\n`                             | Line terminator between records.                                           |
| `quoting`        | `'minimal' \| 'all'`                       | `minimal`                          | `minimal` quotes only when required by RFC 4180; `all` quotes every field. |
| `showHeaders`    | `boolean`                                  | `true`                             | Whether to emit a header row.                                              |
| `columns`        | `(keyof T)[]` or `Record<keyof T, string>` | union of record keys               | Columns to emit. Array of keys, or a map of key to header label.           |
| `nullText`       | `string`                                   | `""`                               | Rendering of `null`.                                                       |
| `undefinedText`  | `string`                                   | `""`                               | Rendering of `undefined`.                                                  |
| `nanText`        | `string`                                   | `""`                               | Rendering of `NaN`.                                                        |
| `infinityText`   | `string`                                   | `Infinity`                         | Rendering of `Infinity`; `-Infinity` renders as `-` followed by this.      |
| `booleans`       | `{ true: string; false: string }`          | `{ true: 'true', false: 'false' }` | Rendering of boolean values.                                               |
| `arraySeparator` | `string`                                   | `, `                               | Separator used to join an array within a single cell.                      |
| `bom`            | `boolean`                                  | `false`                            | Prepend a UTF-8 byte-order mark, which helps some spreadsheet apps.        |

## Behavior notes

- Quoted fields escape an embedded quote character by doubling it, per RFC 4180.
- `null`, `undefined`, and `NaN` render as an empty string by default.
- An absent key and an explicit `undefined` are treated identically.
- An array value is joined into a single cell using `arraySeparator`.

## TypeScript

```typescript
import type { CsvOptions, CsvRecord } from 'csv-pipe';
```

Exported types: `CsvOptions`, `CsvColumns`, `CsvEncoder`, `CsvRecord`, `CsvInput`, `CsvCell`, `CsvPrimitive`, `QuotingMode`, `BooleanStyle`, and the `CsvPipeError` class.

## License

MIT (c) Martsin Labs. See [LICENSE](LICENSE).
