---
description: Parse large CSV inputs as a stream of records with flat memory, from a fetch body or a Node file.
---

# Streaming and files

`createCsvParser(options).stream(source)` returns an `AsyncIterable` of records,
holding only one partial row in memory. Any chunking of the same input yields the
same records, so it is safe over a network. It mirrors the
[encoder's streaming](./streaming).

## Streaming a source

The source can be a string, a sync or async iterable of chunks, a byte stream, or
a Web `ReadableStream`. Byte chunks are decoded as UTF-8, even when a multibyte
character is split across a chunk boundary.

```ts
import { createCsvParser } from 'csv-pipe';

const parser = createCsvParser<{ id: string; value: string }>();

const response = await fetch('/big.csv');
for await (const record of parser.stream(response.body!)) {
  // one record at a time, flat memory
}
```

Options apply to the stream exactly as they do to a full parse, so `header`,
`columns`, `dynamicTyping`, `separator: 'auto'`, and the rest all work here too.

## Reading a file in Node

`csv-pipe/node` exports `readCsv`, the mirror of `writeCsv`. It reads and parses
a file as a stream of records, so a file of any size is never fully loaded.

```ts
import { readCsv } from 'csv-pipe/node';

type User = { name: string; email: string };

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

`readCsv` is a thin wrapper over `createCsvParser(options).stream(...)` on a file
read stream, so it inherits every [parsing option](./parsing-options).
