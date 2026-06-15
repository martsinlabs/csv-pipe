---
description: Move encode and parse calls from papaparse, csv-stringify, csv-parse, or fast-csv to csv-pipe.
---

# Migration

Moving to csv-pipe is usually a one-line change per call plus a small option
remap. It quotes per RFC 4180 by default and infers the header from the record
keys, so many call sites need nothing more. This page covers encoding; parsing
maps the same way (`Papa.parse`, `csv-parse`, and `parseStream` to `parse` and
`createCsvParser`), with the [parsing options](./parsing-options) as the target.

Option names below reflect each library's documented behavior and may change
between versions; check the current docs of each.

## From papaparse

`Papa.unparse` returns a string, and so does `stringify`.

```ts
// Before
import Papa from 'papaparse';
Papa.unparse(rows);

// After
import { stringify } from 'csv-pipe';
stringify(rows);
```

| papaparse (`unparse` config) | csv-pipe                                          |
| ---------------------------- | ------------------------------------------------- |
| `delimiter`                  | `separator`                                       |
| `newline`                    | `newline`                                         |
| `header: false`              | `showHeaders: false`                              |
| `columns: ['a', 'b']`        | `columns: ['a', 'b']`                             |
| `quoteChar`                  | `quote`                                           |
| `quotes: true`               | `quoting: 'all'`                                  |
| `escapeChar`                 | not configurable; quotes are doubled per RFC 4180 |

## From csv-stringify

Use the synchronous entry to match `stringify`'s signature.

```ts
// Before
import { stringify } from 'csv-stringify/sync';
stringify(rows, { header: true });

// After
import { stringify } from 'csv-pipe';
stringify(rows);
```

| csv-stringify option                  | csv-pipe                              |
| ------------------------------------- | ------------------------------------- |
| `delimiter`                           | `separator`                           |
| `record_delimiter`                    | `newline`                             |
| `header: false`                       | `showHeaders: false`                  |
| `columns: ['a', 'b']` or `{ a: 'A' }` | `columns: ['a', 'b']` or `{ a: 'A' }` |
| `quote`                               | `quote`                               |
| `quoted: true`                        | `quoting: 'all'`                      |
| `bom: true`                           | `bom: true`                           |
| `cast: { ... }`                       | [`format`](./formatting) hook         |

## From fast-csv

`writeToString` is asynchronous; `stringify` is synchronous, so you can drop the
`await`.

```ts
// Before
import { writeToString } from '@fast-csv/format';
const csv = await writeToString(rows, { headers: true });

// After
import { stringify } from 'csv-pipe';
const csv = stringify(rows);
```

| fast-csv option       | csv-pipe                      |
| --------------------- | ----------------------------- |
| `delimiter`           | `separator`                   |
| `rowDelimiter`        | `newline`                     |
| `headers: false`      | `showHeaders: false`          |
| `headers: ['a', 'b']` | `columns: ['a', 'b']`         |
| `quote`               | `quote`                       |
| `quoteColumns: true`  | `quoting: 'all'`              |
| `writeBOM: true`      | `bom: true`                   |
| `transform`           | [`format`](./formatting) hook |

For streaming, swap the fast-csv `format()` transform for
[`createCsvEncoder(...).stream(...)`](./streaming), and wrap it with
`toReadableStream` for a Web response or `Readable.from` for a Node stream.

## Behavior to know after switching

- **Quoting is minimal by default.** A field is quoted only when it contains the
  separator, a quote, or a line break. Use `quoting: 'all'` to quote everything.
- **Quotes are escaped by doubling**, per RFC 4180. There is no separate escape
  character.
- **The header is inferred** from the record keys unless you pass `columns` or
  `showHeaders: false`.
- **`Date` renders as an ISO 8601 string**, and `null`, `undefined`, and `NaN`
  render as an empty string. Adjust with [`format`](./formatting) and the text
  options.
- **Columns are typed.** A key that is not on your record is a compile error.
  See [TypeScript](./typescript).
