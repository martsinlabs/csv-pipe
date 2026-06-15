---
description: Stream large CSV exports with flat memory to a file or a Web ReadableStream, plus a browser download helper.
---

# Streaming

`stream` returns string chunks and accepts a sync or async iterable. With
`columns` declared it is fully incremental, reading and emitting one record at a
time; without them the input is buffered first, since the header needs every
key.

```ts
const toCsv = createCsvEncoder<User>({ columns: ['name', 'email'] });

for await (const chunk of toCsv.stream(users)) {
  // write each chunk to a file, socket, or HTTP response
}
```

## A Web ReadableStream

`toReadableStream` adapts the chunk stream to a Web `ReadableStream`, so it
becomes a response body with no buffering. It works in browsers, Deno, Bun, edge
runtimes, and Node 18+.

```ts
import { createCsvEncoder, toReadableStream } from 'csv-pipe';

const encoder = createCsvEncoder({ columns: ['id', 'value'] });

return new Response(toReadableStream(encoder.stream(rows)), {
  headers: { 'content-type': 'text/csv; charset=utf-8' }
});
```

## Writing to a file in Node

`csv-pipe/node` exports `writeCsv`, which streams the encoder straight to a file
with flat memory.

```ts
import { writeCsv } from 'csv-pipe/node';

await writeCsv('users.csv', users, { columns: ['name', 'email'] });
```

For finer control, turn the chunk stream into a Node `Readable` yourself:

```ts
import { Readable } from 'node:stream';

const readable = Readable.from(encoder.stream(rows));
```

## Downloading in the browser

`csv-pipe/browser` exports `downloadCsv`, which encodes the data, triggers a
download, and revokes the object URL afterward. Unlike the helpers above it
builds the whole CSV in memory first, so it is the convenient path when the data
fits in memory rather than a streaming one.

```ts
import { downloadCsv } from 'csv-pipe/browser';

downloadCsv(users, { filename: 'users.csv' });
```
