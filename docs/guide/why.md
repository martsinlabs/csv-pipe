---
description: Typed columns, two-way streaming, formula-injection safety, and RFC 4180 correctness in one CSV library.
---

# Why csv-pipe

- **Typed columns.** Column names are checked against your data. A typo or a
  renamed field is a compile error, not a broken export found in production.
- **Encodes and parses.** `stringify` and `parse` are mirror images, both typed
  and streaming, so encode then parse round-trips your data unchanged.
- **Runs where your code runs.** The core imports no `fs` and no DOM, and
  streaming returns a Web `ReadableStream`. One import for Node, the browser,
  Deno, Bun, and edge.
- **Flat memory, both ways.** Encode and parse stream incrementally, one record
  at a time, so a file or HTTP body of any size stays at flat memory.
- **Safe by a flag.** `sanitizeFormulas` neutralizes spreadsheet formula
  injection (cells starting with `=`, `+`, `-`, `@`, a tab, or a carriage
  return), so you never hand-sanitize cells.
- **Fast and small.** The fastest common parser by a wide margin, and the
  fastest or on-par encoder, across every benchmark, at under 2 kB per direction
  with zero dependencies.

## A typo never ships

Columns are checked against your record type. A renamed field cannot silently
break an export.

```ts twoslash
// @errors: 2820
import { stringify } from 'csv-pipe';
type User = { name: string; email: string; age: number };
const users: User[] = [{ name: 'Ada', email: 'ada@example.com', age: 36 }];
// ---cut---
stringify(users, { columns: ['name', 'emial'] });
```
