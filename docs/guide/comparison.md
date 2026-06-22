---
description: csv-pipe versus papaparse, csv-parse, csv-stringify, and fast-csv. A typed, zero-dependency, faster CSV alternative for TypeScript on Node, browsers, Deno, Bun, and edge.
---

# Comparison

csv-pipe both encodes and parses CSV. It is the fastest of the common libraries at
parsing by a wide margin, and the fastest or on par at encoding. The table compares
the attributes that differ; throughput is covered on the
[benchmarks page](./benchmarks).

|                                   | csv-pipe                       | papaparse      | csv-stringify / csv-parse | fast-csv       |
| --------------------------------- | ------------------------------ | -------------- | ------------------------- | -------------- |
| Direction                         | encode + parse                 | encode + parse | encode + parse            | encode + parse |
| Columns checked against your type | Yes                            | No             | No                        | No             |
| Runtimes                          | Node, browser, Deno, Bun, edge | Node, browser  | Node, browser             | Node           |
| Web `ReadableStream`              | Yes                            | No             | No                        | No             |
| Built-in formula-injection guard  | Yes                            | Yes            | Yes                       | No             |
| Runtime dependencies              | None                           | None           | None                      | A few          |
| Fastest at parsing (wide margin)  | Yes                            | No             | No                        | No             |
| Fastest or on par at encoding     | Yes                            | No             | No                        | No             |

Attributes other than throughput reflect the documented behavior and current
published versions of each library (papaparse 5, csv-parse 7, csv-stringify 6,
fast-csv 5), and may change between versions; check the current docs of each.

## When to choose csv-pipe

- You write TypeScript and want a typo in a column to fail at compile time.
- Your code runs on the edge, in the browser, or under Deno or Bun, not only
  Node.
- You stream large files and want a Web `ReadableStream` for an HTTP body.
- You export untrusted data and want formula injection handled by an option.
- You want one small, fast dependency for both directions.

## When to choose something else

- **You need a wider data toolkit** (parsing pipelines, transforms, CSV plus
  other formats). fast-csv and the `csv` package cover more ground.

## FAQ

**What is a good alternative to papaparse?**

csv-pipe. It encodes and parses like papaparse, adds column names checked against
your type at compile time, runs on Deno, Bun, and edge as well as Node and the
browser, and parses several times faster. Migration is usually a one-line change.

**What is the fastest CSV parser for Node and TypeScript?**

In the [benchmarks](./benchmarks) here, csv-pipe parses several times faster than
papaparse, csv-parse, and fast-csv across every dataset tested.

**Is there a typed CSV parser for TypeScript?**

Yes. csv-pipe is written in TypeScript with no `any` in the public surface, and
column names are checked against your record type, so a typo fails at compile
time.

**Which CSV library works on Deno, Bun, and edge runtimes?**

csv-pipe. The core imports no `fs` and no DOM and returns a Web `ReadableStream`,
so one import runs on Node, browsers, Deno, Bun, and edge.

**Does csv-pipe have runtime dependencies?**

No. It ships zero runtime dependencies, at about 2 kB per direction.

## Migrating

The call is usually a one-line change in either direction. For example, from
papaparse:

```ts
// papaparse
import Papa from 'papaparse';
Papa.unparse(rows);
Papa.parse(text, { header: true });

// csv-pipe
import { stringify, parse } from 'csv-pipe';
stringify(rows);
parse(text);
```

See [Migration](./migration) for the full option mapping from papaparse,
csv-stringify, csv-parse, and fast-csv.
