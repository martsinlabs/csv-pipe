---
description: Stream CSV output with flat memory to a Web ReadableStream, a Node file, or a gzip stream, plus a browser download helper.
---

# Streaming

`encoder.stream(data)` yields the CSV as string chunks and accepts a sync or
async iterable of records. With `columns` declared it is fully incremental: it
emits the header, then one line per record, holding nothing extra. Without
`columns` it buffers the input first, since the header is the union of every
record key.

```ts
import { createCsvEncoder } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];

const encoder = createCsvEncoder<User>({ columns: ['name', 'email'] });

for await (const chunk of encoder.stream(users)) {
  // each chunk is a piece of the CSV text: write it to a file, socket, or body
}
```

## Serve a CSV from an HTTP handler

`toReadableStream` adapts the chunk stream to a Web `ReadableStream`, so it
becomes a response body with no buffering. It works in browsers, Deno, Bun, edge
runtimes, and Node 18+.

```ts
import { createCsvEncoder, toReadableStream } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const encoder = createCsvEncoder<User>({ columns: ['name', 'email'] });

function handler(users: Iterable<User>): Response {
  return new Response(toReadableStream(encoder.stream(users)), {
    headers: { 'content-type': 'text/csv; charset=utf-8' }
  });
}
```

## Stream a download from an edge route

The same body becomes a file download when the route adds a `content-disposition`
header. The handler takes a Web `Request` and returns a `Response`, so it runs
unchanged on any fetch-style runtime: Vercel and Cloudflare edge, Deno, Bun, or
Node. The rows stream out as they arrive, so memory stays flat no matter how many
`loadUsers` yields.

```ts
import { createCsvEncoder, toReadableStream } from 'csv-pipe';

type User = { name: string; email: string; age: number };

async function* loadUsers(): AsyncIterable<User> {
  // pull each page from a database or API and yield its rows
  yield { name: 'Alex Johnson', email: 'alex@example.com', age: 29 };
  yield { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 };
}

const encoder = createCsvEncoder<User>({ columns: ['name', 'email'] });

export function GET(_request: Request): Response {
  return new Response(toReadableStream(encoder.stream(loadUsers())), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="users.csv"'
    }
  });
}
```

## Stream from a database or paged API

`stream` accepts an async iterable, so rows from a cursor or a paged endpoint
become CSV as they arrive, without ever collecting them all.

```ts
import { createCsvEncoder, toReadableStream } from 'csv-pipe';

type User = { name: string; email: string; age: number };

async function* fetchUsers(): AsyncIterable<User> {
  // pull a batch from the database, yield its rows, repeat
  yield { name: 'Alex Johnson', email: 'alex@example.com', age: 29 };
  yield { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 };
}

const encoder = createCsvEncoder<User>({ columns: ['name', 'email'] });
const body = toReadableStream(encoder.stream(fetchUsers()));
```

## Write to a file in Node

`csv-pipe/node` exports `writeCsv`, which streams the encoder straight to a file
with flat memory.

```ts
import { writeCsv } from 'csv-pipe/node';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];

await writeCsv('users.csv', users, { columns: ['name', 'email'] });
```

## Pipe to any Node stream

Turn the chunk stream into a Node `Readable` to send it through a pipeline, for
example gzip straight to a file.

```ts
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { createCsvEncoder } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 }
];
const encoder = createCsvEncoder<User>({ columns: ['name', 'email'] });

await pipeline(
  Readable.from(encoder.stream(users)),
  createGzip(),
  createWriteStream('users.csv.gz')
);
```

## Download in the browser

`csv-pipe/browser` exports `downloadCsv`, which encodes the data, triggers a
download, and revokes the object URL afterward. Unlike the helpers above it builds
the whole CSV in memory first, so it suits data that fits in memory rather than a
stream.

```ts
import { downloadCsv } from 'csv-pipe/browser';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];

downloadCsv(users, { filename: 'users.csv' });
```
