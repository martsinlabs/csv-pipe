---
layout: home

hero:
  text: Typed CSV, encode and parse, for every runtime
  tagline: A small, fast, zero-dependency CSV encoder and parser for TypeScript and JavaScript. RFC 4180 correct, checked against your data, and the same core on Node, browsers, Deno, Bun, and edge.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: API reference
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/martsinlabs/csv-pipe

features:
  - icon:
      src: /icons/typed.svg
      width: 28
      height: 28
    title: Typed columns
    details: Column names are checked against your data. A typo or a renamed field is a compile error, not a broken export found in production.
  - icon:
      src: /icons/runtimes.svg
      width: 28
      height: 28
    title: Runs where your code runs
    details: The core imports no fs and no DOM, and streaming returns a Web ReadableStream. One import for Node, the browser, Deno, Bun, and edge.
  - icon:
      src: /icons/stream.svg
      width: 28
      height: 28
    title: Flat memory, both ways
    details: Encode and parse stream incrementally, one record at a time, so a file or an HTTP body of any size stays at flat memory.
  - icon:
      src: /icons/safe.svg
      width: 28
      height: 28
    title: Safe by a flag
    details: sanitizeFormulas neutralizes spreadsheet formula injection, so you never hand-sanitize cells before an export.
  - icon:
      src: /icons/escaping.svg
      width: 28
      height: 28
    title: RFC 4180 correct
    details: Quoting and escaping follow RFC 4180, and encode then parse round-trips your data back unchanged.
  - icon:
      src: /icons/fast.svg
      width: 28
      height: 28
    title: Fast and small
    details: The fastest common parser by a wide margin, and the fastest or on-par encoder, across every benchmark, at under 2 kB per direction with zero dependencies.
---

<div style="max-width: 960px; margin: 4rem auto 0; padding: 0 24px;">

## One line for the common case

```ts twoslash
import { stringify } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];

stringify(users);
// name,email,age
// Alex Johnson,alex@example.com,29
// Carlos Herrera,carlos@example.com,24
```

The header comes from the record keys, and a field is quoted only when it needs
to be.

## And back again

```ts twoslash
import { parse } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users = parse<User>('name,email,age\nAlex Johnson,alex@example.com,29');
//    ^?
```

`parse` is the mirror of `stringify`, typed and streaming, so encode then parse
round-trips your data. [Get started](/guide/getting-started), read
[why csv-pipe](/guide/why), or see the [benchmarks](/guide/benchmarks).

</div>
