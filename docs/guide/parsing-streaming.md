---
description: Parse CSV as a stream of records with flat memory, from a fetch body, a browser file upload, a Node file, or a gzip stream.
---

# Streaming and files

`createCsvParser(options).stream(source)` returns an `AsyncIterable` of records
and holds only one partial row in memory, so a file or response of any size stays
flat. The source can be a string, a sync or async iterable of chunks, a byte
stream, or a Web `ReadableStream`; byte chunks are decoded as UTF-8 even when a
multibyte character is split across a boundary. Any chunking yields the same
records, so it is safe over a network, and the [encoder streams](./streaming) the
same way.

Every parsing [option](./parsing-options) applies to the stream, so `header`,
`columns`, `dynamicTyping`, and `separator: 'auto'` work here too.

## Fetch a remote file

```ts
import { createCsvParser } from 'csv-pipe';

type Row = { id: string; value: string };

const response = await fetch('/big.csv');
for await (const record of createCsvParser<Row>().stream(response.body!)) {
  // one record at a time, the body is never buffered whole
}
```

## Parse an uploaded file in the browser

A `File` from an `<input type="file">` is a `Blob`, so `file.stream()` feeds the
parser straight from disk.

```ts
import { createCsvParser } from 'csv-pipe';

const input = document.querySelector<HTMLInputElement>('input[type=file]')!;

input.addEventListener('change', async () => {
  const file = input.files?.[0];
  if (!file) return;
  for await (const record of createCsvParser().stream(file.stream())) {
    // one record per row, even for a multi-gigabyte upload
  }
});
```

## Read a file in Node

`csv-pipe/node` exports `readCsv`, the mirror of `writeCsv`. It reads and parses
a file as a stream of records, so a file of any size is never fully loaded.

```ts
import { readCsv } from 'csv-pipe/node';

type User = { name: string; email: string; age: number };

for await (const user of readCsv<User>('users.csv')) {
  // one record at a time
}
```

Pass `header: false` for raw `string[]` rows, plus any other parsing option:

```ts
for await (const row of readCsv('users.csv', { header: false })) {
  // string[]
}
```

## Walk a large file with flat memory

Because records arrive one at a time, you can fold over a file far larger than
memory.

```ts
import { readCsv } from 'csv-pipe/node';

type Order = { total: string };

let revenue = 0;
for await (const order of readCsv<Order>('orders.csv')) {
  revenue += Number(order.total);
}
// orders.csv is never held in memory; only `revenue` grows
```

## Decompress on the fly

Pipe a gzip source through a decompressor first, then into the parser.

::: code-group

```ts [Node]
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createCsvParser } from 'csv-pipe';

const source = createReadStream('users.csv.gz').pipe(createGunzip());
for await (const user of createCsvParser().stream(source)) {
  // ...
}
```

```ts [Web]
import { createCsvParser } from 'csv-pipe';

const response = await fetch('/users.csv.gz');
const source = response.body!.pipeThrough(new DecompressionStream('gzip'));
for await (const user of createCsvParser().stream(source)) {
  // ...
}
```

:::

## Stopping early

`break` out of the loop or pass `maxRows`, and csv-pipe releases the source: it
cancels a Web `ReadableStream` or closes a Node file handle, so nothing leaks.

```ts
import { readCsv } from 'csv-pipe/node';

for await (const row of readCsv('huge.csv', { maxRows: 100 })) {
  // stops after 100 records, then closes the file
}
```
