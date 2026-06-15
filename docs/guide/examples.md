---
description: Runnable csv-pipe examples for encoding, columns, formatting, streaming, parsing, and security.
---

# Examples

Runnable snippets for each task live in the
[examples/](https://github.com/martsinlabs/csv-pipe/tree/master/examples)
directory. Each file imports `csv-pipe` and is type-checked in CI, so they stay
in sync with the library. Run one with any TypeScript runner:

```sh
npx tsx examples/basic.ts
```

| Example                                                                                             | Shows                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [basic.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/basic.ts)                   | Encode an array of objects into a CSV string. |
| [columns.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/columns.ts)               | Select, order, and label columns.             |
| [formatting.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/formatting.ts)         | Transform values with the `format` hook.      |
| [streaming-node.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/streaming-node.ts) | Stream to a file with flat memory.            |
| [streaming-web.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/streaming-web.ts)   | Serve a CSV as an HTTP response.              |
| [read-file.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/read-file.ts)           | Parse a file as a stream of typed records.    |
| [security.ts](https://github.com/martsinlabs/csv-pipe/blob/master/examples/security.ts)             | Guard against formula injection.              |

## Basic

```ts
import { stringify } from 'csv-pipe';

const users = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];

stringify(users);
// name,email,age
// Alex Johnson,alex@example.com,29
// Carlos Herrera,carlos@example.com,24
```

## Serve a CSV from an HTTP handler

```ts
import { createCsvEncoder, toReadableStream } from 'csv-pipe';

const encoder = createCsvEncoder({ columns: ['id', 'value'] });

export function handler(
  rows: Iterable<{ id: number; value: number }>
): Response {
  return new Response(toReadableStream(encoder.stream(rows)), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="data.csv"'
    }
  });
}
```

More on these in [Streaming](./streaming) and [Security](./security).
