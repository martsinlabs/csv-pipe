---
description: How csv-pipe compares with papaparse, csv-stringify, csv-parse, and fast-csv.
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
| Runtimes                          | Node, browser, Deno, Bun, edge | Node, browser  | Node                      | Node           |
| Web `ReadableStream`              | Yes                            | No             | No                        | No             |
| Built-in formula-injection guard  | Yes                            | No             | No                        | No             |
| Runtime dependencies              | None                           | None           | A few                     | A few          |
| Fastest at parsing (wide margin)  | Yes                            | No             | No                        | No             |
| Fastest or on par at encoding     | Yes                            | No             | No                        | No             |

Attributes other than throughput reflect each library's documented behavior and
may change between versions; check the current docs of each.

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
