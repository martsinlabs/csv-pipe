---
description: Parse CSV into typed records, the mirror of stringify, with streaming, dynamic typing, and validation.
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
`JSON.parse(...) as T`; see [Typing and validation](./parsing-typing) to enforce
it at runtime.

## Headerless data

With `header: false` each record is the raw `string[]`. Provide
[`columns`](./parsing-columns) to key the rows by position instead.

```ts
import { parse } from 'csv-pipe';

parse('1,2\n3,4', { header: false });
// [['1', '2'], ['3', '4']]
```

## Lenient by default

Parsing is forgiving: a short row pads missing fields with `''`, extra fields are
dropped, and blank lines are skipped. Turn on [`strict`](./parsing-options#strict-mode)
to reject ragged rows instead.

```ts
parse('a,b\n1'); // [{ a: '1', b: '' }]
parse('a,b\n1,2,3'); // [{ a: '1', b: '2' }]
```

## Next

- [Choosing columns](./parsing-columns) to select, rename, and position columns.
- [Typing and validation](./parsing-typing) for dynamic typing and the `row` hook.
- [Streaming and files](./parsing-streaming) for large inputs and `readCsv`.
- [Options](./parsing-options) for every parsing option.
