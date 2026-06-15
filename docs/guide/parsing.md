---
description: Parse CSV text into typed records, with streaming, dynamic typing, and validation.
---

# Parsing

csv-pipe parses as well as it encodes. `parse` is the mirror of `stringify`, and
`createCsvParser` mirrors `createCsvEncoder`, so the same mental model and the
same runtimes apply in both directions.

## Quick start

By default the first row is the header, and each record is a typed object.

```ts twoslash
import { parse } from 'csv-pipe';

type User = { name: string; email: string };

const users = parse<User>('name,email\nAda,ada@example.com');
//    ^?
```

Hover `users` above: it is `User[]`. The type is an assertion, like
`JSON.parse(...) as T`; see [Validation](#validation) to enforce it at runtime.

## Headerless data

With `header: false` each record is the raw `string[]`. Provide `columns` to key
the rows by position instead.

```ts
import { parse } from 'csv-pipe';

parse('1,2\n3,4', { header: false });
// [['1', '2'], ['3', '4']]

parse('1,2\n3,4', { header: false, columns: ['x', 'y'] });
// [{ x: '1', y: '2' }, { x: '3', y: '4' }]
```

A rename map normalizes messy headers into your keys:

```ts
parse('Full Name,Email\nAda,ada@example.com', {
  columns: { 'Full Name': 'name', Email: 'email' }
});
// [{ name: 'Ada', email: 'ada@example.com' }]
```

## Dynamic typing

Off by default. When on, a value is coerced to a number or boolean only when it
round-trips exactly, so `"007"` and `"1.50"` stay strings.

```ts
parse('id,active\n42,true', { dynamicTyping: true });
// [{ id: 42, active: true }]
```

## Auto-detecting the delimiter

```ts
parse('a;b\n1;2', { separator: 'auto' });
// [{ a: '1', b: '2' }] — detects ; from , ; tab |
```

## Streaming

`createCsvParser(options).stream(source)` returns an `AsyncIterable` of records,
holding only one partial row in memory. The source can be a string, an iterable
or async iterable of chunks, a byte stream, or a Web `ReadableStream`.

```ts
import { createCsvParser } from 'csv-pipe';

const parser = createCsvParser<{ id: string; value: string }>();

const response = await fetch('/big.csv');
for await (const record of parser.stream(response.body!)) {
  // one record at a time, flat memory
}
```

## Reading a file in Node

`csv-pipe/node` exports `readCsv`, the mirror of `writeCsv`, which reads and
parses a file as a stream of records with flat memory.

```ts
import { readCsv } from 'csv-pipe/node';

for await (const user of readCsv<User>('users.csv')) {
  // one record at a time, the file is never fully loaded
}
```

## Validation

Pass a `row` hook to turn each raw record into the final element. This is where a
schema library (or a hand-written guard) enforces the type at runtime.

```ts
import { parse } from 'csv-pipe';

const users = parse('id\n1\n2', {
  row: (record) => ({ id: Number(record.id) })
});
// [{ id: 1 }, { id: 2 }]
```

## Options

| Option           | Type                              | Default | Description                                           |
| ---------------- | --------------------------------- | ------- | ----------------------------------------------------- |
| `header`         | `boolean`                         | `true`  | Use the first row as keys; `false` yields `string[]`. |
| `columns`        | `(keyof T)[]` or label-to-key map | none    | Name, select, or rename columns.                      |
| `separator`      | `string` or `'auto'`              | `,`     | Field separator, or detect it.                        |
| `quote`          | `string`                          | `"`     | Quote character.                                      |
| `skipEmptyLines` | `boolean \| 'greedy'`             | `true`  | Drop blank (or whitespace-only) lines.                |
| `comment`        | `string`                          | none    | Skip lines starting with this.                        |
| `trim`           | `boolean`                         | `false` | Trim whitespace around every field.                   |
| `bom`            | `boolean`                         | auto    | Strip a leading UTF-8 byte-order mark.                |
| `dynamicTyping`  | `boolean`                         | `false` | Coerce numbers and booleans losslessly.               |
| `strict`         | `boolean`                         | `false` | Throw on a row whose field count differs.             |
| `maxRows`        | `number`                          | none    | Stop after this many records.                         |
| `row`            | `(record, context) => T`          | none    | Map or validate each record.                          |

See the [API reference](/api/) for the typed definitions, and
[Benchmarks](./benchmarks) for the parsing throughput.
