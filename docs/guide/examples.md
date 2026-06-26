---
description: Copy-paste recipes for the common tasks, from encoding and parsing to streaming, validation, and a safe browser download.
---

# Examples

Short, copy-paste recipes for the common tasks, each linking to the full guide.
Runnable versions live in the
[examples/](https://github.com/martsinlabs/csv-pipe/tree/master/examples)
directory and are type-checked in CI, so they stay in sync with the library.

The encoding recipes build on this shared setup:

```ts
import { createCsvEncoder, parse, stringify, toReadableStream } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];
```

## Encode an array of objects

The header is inferred from the record keys, and a field is quoted only when it
needs to be.

```ts
stringify(users);
// name,email,age
// Alex Johnson,alex@example.com,29
// Carlos Herrera,carlos@example.com,24
```

## Parse CSV into typed records

`parse` is the mirror of `stringify`. See [Parsing](./parsing).

```ts
parse<User>('name,email,age\nAlex Johnson,alex@example.com,29');
// [{ name: 'Alex Johnson', email: 'alex@example.com', age: '29' }]
```

## Select, order, and rename columns

A map sets the header label per key. See [Choosing columns](./columns).

```ts
stringify(users, { columns: { name: 'Full name', email: 'Email address' } });
// Full name,Email address
// Alex Johnson,alex@example.com
// Carlos Herrera,carlos@example.com
```

## Format dates and numbers

A `Date` becomes an ISO string on its own; the `format` hook handles the rest.
See [Formatting values](./formatting).

```ts
type Order = { id: number; total: number; placedAt: Date };

const orders: Order[] = [
  { id: 1, total: 19.5, placedAt: new Date('2026-06-04T10:00:00Z') }
];

stringify(orders, {
  format: (value) => (typeof value === 'number' ? value.toFixed(2) : value)
});
// id,total,placedAt
// 1.00,19.50,2026-06-04T10:00:00.000Z
```

## Serve a CSV over HTTP

`toReadableStream` turns the encoder into a response body with no buffering. See
[Streaming](./streaming).

```ts
const encoder = createCsvEncoder<User>({ columns: ['name', 'email'] });

function handler(): Response {
  return new Response(toReadableStream(encoder.stream(users)), {
    headers: { 'content-type': 'text/csv; charset=utf-8' }
  });
}
```

## Write a large file in Node

`writeCsv` streams the encoder straight to a file. See [Streaming](./streaming).

```ts
import { writeCsv } from 'csv-pipe/node';

await writeCsv('users.csv', users, { columns: ['name', 'email'] });
```

## Read a large file in Node

`readCsv` parses a file as a stream of records, so it is never fully loaded. See
[Streaming and files](./parsing-streaming).

```ts
import { readCsv } from 'csv-pipe/node';

for await (const user of readCsv<User>('users.csv')) {
  // one record at a time
}
```

## Validate each row

The `row` hook receives each record and returns the final element, so a schema
or a guard enforces the type. See [Typing and validation](./parsing-typing).

```ts
parse('id\n1\n2', { row: (record) => ({ id: Number(record.id) }) });
// [{ id: 1 }, { id: 2 }]
```

## Guard untrusted exports

`sanitizeFormulas` prefixes any cell that a spreadsheet might read as a formula.
See [Security](./security).

```ts
const exportRows = [
  { name: '=1+1', note: 'leading equals' },
  { name: '@SUM(A1:A9)', note: 'leading at' }
];

stringify(exportRows, { sanitizeFormulas: true });
// name,note
// '=1+1,leading equals
// '@SUM(A1:A9),leading at
```

## Change the delimiter

`parse` reads the input and `stringify` writes it with a different separator.
Use `separator: 'auto'` when the input format is unknown. See
[Parsing options](./parsing-options) and [Stringify options](./options).

```ts
const csv = 'name,email,age\nAlex Johnson,alex@example.com,29';

const rows = parse(csv);
stringify(rows, { separator: ';' });
// name;email;age
// Alex Johnson;alex@example.com;29
```

For an input with an unknown separator, let the parser detect it:

```ts
stringify(parse(csv, { separator: 'auto' }), { separator: ';' });
// name;email;age
// Alex Johnson;alex@example.com;29
```

## Download in the browser

`downloadCsv` encodes the data and triggers a download. See
[Streaming](./streaming).

```ts
import { downloadCsv } from 'csv-pipe/browser';

downloadCsv(users, { filename: 'users.csv' });
```

## Runnable examples

Run any of these with a TypeScript runner, for example `npx tsx examples/basic.ts`.

| Example                                                                                             | Shows                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [basic.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/basic.ts)                   | Encode an array of objects into a CSV string. |
| [columns.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/columns.ts)               | Select, order, and label columns.             |
| [formatting.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/formatting.ts)         | Transform values with the `format` hook.      |
| [streaming-node.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/streaming-node.ts) | Stream to a file with flat memory.            |
| [streaming-web.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/streaming-web.ts)   | Serve a CSV as an HTTP response.              |
| [read-file.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/read-file.ts)           | Parse a file as a stream of typed records.    |
| [security.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/security.ts)             | Guard against formula injection.              |
