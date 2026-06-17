# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.1.0 - 2026-06-17

A complete rewrite into a fast, deterministic, RFC 4180-compliant CSV encoder and parser.

### Added

- `stringify(data, options)` for the common case, and `createCsvEncoder(options)`,
  a callable encoder with `row` and `stream` (an `AsyncIterable`).
- `parse(text, options)` and `createCsvParser(options)`, the mirror of the
  encoder: typed records, a `stream` method that accepts strings, iterables, byte
  chunks, or a Web `ReadableStream` with flat memory, and options for `columns`,
  `separator` (with `'auto'` detection), `dynamicTyping`, `skipEmptyLines`,
  `comment`, `trim`, `strict`, `maxRows`, and a `row` validation hook.
- `toReadableStream`, which adapts a stream to a Web `ReadableStream`.
- Platform entry points: `csv-pipe/browser` exports `downloadCsv`, and
  `csv-pipe/node` exports `writeCsv` and `readCsv`. The core entry stays
  platform-neutral.
- One `columns` option that selects, orders, and labels columns. It takes an
  array of keys, or a map of key to header label, with keys checked against the
  record type.
- A `format` hook to transform each value before encoding (render dates, format
  numbers, serialize objects).
- `Date` values render as ISO 8601 strings by default.
- `finalNewline` option to append a trailing newline.
- `quoting: 'non-numeric'`, which quotes every field except numbers and bigints.
- `sanitizeFormulas` (with a configurable `formulaPrefix`) to guard string and
  array cells against spreadsheet formula injection.
- `CsvPipeError` for values that cannot be a cell (a plain object, function, or
  symbol); the message names the row and column.
- A benchmark suite (`npm run bench`) and gh-pages throughput tracking that
  drives live README badges.

### Changed

- Fully typed options (`CsvOptions<T>`) with no `any`.
- `null`, `undefined`, and `NaN` render as `""` (were `"null"` and `"undefined"`).
- Booleans render as `true` and `false` (were `TRUE` and `FALSE`).
- Quoting defaults to `minimal`: a field is quoted only when it contains the
  separator, a quote, CR, or LF (previously every field was quoted).
- Columns are the stable union of record keys, and a missing key and an explicit
  `undefined` are treated the same.
- The encoder rejects a `separator` or `quote` that is not a single character,
  matching the parser, with a `CsvPipeError`.

### Removed

- The `CsvPipe` class and its `generate` method, and the old `CpConfig` shape.
  Use `stringify` or `createCsvEncoder` instead.

### Fixed

- RFC 4180 quote escaping: an embedded quote is doubled.
- Stable column alignment across reordered and partial records.
- No empty header row with the default configuration.
- A deterministic core with no import-time state (the filename timestamp bug).
- Consistent handling of `-Infinity` and `NaN`.
- Separator auto-detection (`separator: 'auto'`) skips leading blank and comment
  lines, so a metadata or comment line above the header no longer forces the
  delimiter to a comma. Applies to both the synchronous and streaming paths.
- An invalid `Date` cell throws a located `CsvPipeError` naming the row and
  column, instead of a bare `RangeError`.
- The streaming parser releases its source on early exit (a `break` or
  `maxRows`), cancelling a Web `ReadableStream` and closing a Node file handle.
- `strict` mode reports the 1-based source row, where the header is row 1.

### Tooling

- Dual ESM and CJS build with type declarations (tsup), TypeScript 6, Vitest
  with coverage, ESLint, and Prettier. Zero runtime dependencies.
- GitHub Actions CI runs typecheck, lint, format check, tests, and build across
  Node 18, 20, and 22, plus a cross-runtime smoke test of the built bundle on
  Node, Deno, and Bun.
- Supply-chain hardening: CodeQL analysis and weekly Dependabot updates.
- The encoder precompiles its quote test and escape and encodes rows in a tight
  loop, making it the fastest of the benchmarked encoders on every dataset.
- CI verifies the published package with publint and checks type resolution
  across module modes with are-the-types-wrong.
- A conformance layer in CI: a curated edge-case corpus, the external
  csv-spectrum suite, and fast-check property tests (never throws, round-trips,
  chunk-invariant), plus a bundle-size budget (size-limit) and live coverage and
  bundle-size badges.
- Published to npm over OIDC trusted publishing, with provenance.
