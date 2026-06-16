# csv-pipe

[![CI](https://img.shields.io/github/actions/workflow/status/martsinlabs/csv-pipe/ci.yml?branch=master&label=CI)](https://github.com/martsinlabs/csv-pipe/actions/workflows/ci.yml) [![coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fmartsinlabs.github.io%2Fcsv-pipe%2Fcoverage-badge.json)](https://github.com/martsinlabs/csv-pipe/actions/workflows/ci.yml) [![bundle size](https://img.shields.io/endpoint?url=https%3A%2F%2Fmartsinlabs.github.io%2Fcsv-pipe%2Fsize-badge.json)](https://martsinlabs.github.io/csv-pipe/guide/benchmarks) [![encode throughput](https://img.shields.io/endpoint?url=https%3A%2F%2Fmartsinlabs.github.io%2Fcsv-pipe%2Fencode-badge.json)](https://martsinlabs.github.io/csv-pipe/guide/benchmarks) [![parse throughput](https://img.shields.io/endpoint?url=https%3A%2F%2Fmartsinlabs.github.io%2Fcsv-pipe%2Fparse-badge.json)](https://martsinlabs.github.io/csv-pipe/guide/benchmarks)

A small, fast, zero-dependency CSV encoder and parser for TypeScript and JavaScript. It converts between arrays of objects and RFC 4180-compliant CSV, with typed streaming in both directions, and runs in Node, browsers, Deno, Bun, and edge runtimes.

**[Documentation](https://martsinlabs.github.io/csv-pipe/)** · [Guide](https://martsinlabs.github.io/csv-pipe/guide/getting-started) · [API](https://martsinlabs.github.io/csv-pipe/api/) · [Benchmarks](https://martsinlabs.github.io/csv-pipe/guide/benchmarks)

## Install

```
npm install csv-pipe
```

## Usage

Encode an array of objects into CSV:

```ts
import { stringify } from 'csv-pipe';

stringify([
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
]);
// name,email,age
// Alex Johnson,alex@example.com,29
// Carlos Herrera,carlos@example.com,24
```

And parse it back into typed records:

```ts
import { parse } from 'csv-pipe';

type User = { name: string; email: string; age: number };

parse<User>('name,email,age\nAlex Johnson,alex@example.com,29');
// [{ name: 'Alex Johnson', email: 'alex@example.com', age: '29' }]
```

The header comes from the record keys, quoting and escaping are correct out of the box, and both directions stream and run in every runtime.

## Why csv-pipe

- **Typed columns.** Column names are checked against your data, so a typo is a compile error, not a broken export found in production.
- **Encodes and parses.** `stringify` and `parse` are mirror images, both typed and streaming, so encoding then parsing round-trips your rows, with dynamic typing to recover numbers and booleans.
- **Runs where your code runs.** The core imports no `fs` and no DOM, and streaming returns a Web `ReadableStream`. One import for Node, the browser, Deno, Bun, and edge.
- **Flat memory.** Parsing streams one record at a time, and encoding does too once the columns are declared, so a file or an HTTP body of any size stays at flat memory.
- **Safe by a flag.** `sanitizeFormulas` neutralizes spreadsheet formula injection, so you never hand-sanitize cells.
- **Fast and small.** The fastest common parser by a wide margin, and the fastest or on-par encoder, across every [benchmark](https://martsinlabs.github.io/csv-pipe/guide/benchmarks), at about 2 kB per direction with zero dependencies.

## Documentation

The full documentation is at [martsinlabs.github.io/csv-pipe](https://martsinlabs.github.io/csv-pipe/):

- [Getting started](https://martsinlabs.github.io/csv-pipe/guide/getting-started), [Why csv-pipe](https://martsinlabs.github.io/csv-pipe/guide/why), [Comparison](https://martsinlabs.github.io/csv-pipe/guide/comparison), and [Migration](https://martsinlabs.github.io/csv-pipe/guide/migration)
- Encoding: [columns](https://martsinlabs.github.io/csv-pipe/guide/columns), [formatting](https://martsinlabs.github.io/csv-pipe/guide/formatting), [streaming](https://martsinlabs.github.io/csv-pipe/guide/streaming), and [options](https://martsinlabs.github.io/csv-pipe/guide/options)
- Parsing: [overview](https://martsinlabs.github.io/csv-pipe/guide/parsing), [columns](https://martsinlabs.github.io/csv-pipe/guide/parsing-columns), [typing and validation](https://martsinlabs.github.io/csv-pipe/guide/parsing-typing), [streaming and files](https://martsinlabs.github.io/csv-pipe/guide/parsing-streaming), and [options](https://martsinlabs.github.io/csv-pipe/guide/parsing-options)
- [TypeScript](https://martsinlabs.github.io/csv-pipe/guide/typescript), [error handling](https://martsinlabs.github.io/csv-pipe/guide/errors), and [security](https://martsinlabs.github.io/csv-pipe/guide/security)
- [Benchmarks](https://martsinlabs.github.io/csv-pipe/guide/benchmarks) and the [API reference](https://martsinlabs.github.io/csv-pipe/api/)

## Contributing

Contributions are welcome. See [CONTRIBUTING](CONTRIBUTING.md) for setup and conventions, [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md) for community standards, and [SECURITY](SECURITY.md) for reporting vulnerabilities.

## License

[MIT](https://github.com/martsinlabs/csv-pipe/blob/master/LICENSE) © Martsin Labs
