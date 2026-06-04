---
'csv-pipe': major
---

v2.0.0 is a complete rewrite into a fast, deterministic, RFC 4180-correct CSV encoder.

**Breaking changes**

- New API. `stringify(data, options)` for the common case, and
  `createCsvEncoder(options)` which returns a callable encoder with `row` and
  `stream` (an `AsyncIterable`). `toReadableStream` adapts a stream to a Web
  `ReadableStream`. The old `CsvPipe` class and its `generate` method are removed.
- Platform entry points: `csv-pipe/browser` exports `downloadCsv`, and
  `csv-pipe/node` exports `writeCsv`. The core entry stays platform-neutral.
- Fully typed options (`CsvOptions<T>`) with no `any`. The old `CpConfig` shape
  is removed.
- One `columns` option replaces the separate `columns` plus `headers`. It takes
  an array of keys, or a map of key to header label. Keys are checked against the
  record type.
- Behavior defaults changed:
  - `null`, `undefined`, and `NaN` now render as `""` (was `"null"` / `"undefined"`).
  - Booleans now render as `true` / `false` (was `TRUE` / `FALSE`).
  - Quoting is now `minimal` by default. A field is quoted only when it contains
    the separator, a quote, CR, or LF (previously every field was quoted).
  - Columns are the stable union of record keys. An absent key and an explicit
    `undefined` are treated identically.

**Fixes**

- RFC 4180 quote escaping (embedded quotes are doubled).
- Stable column alignment across reordered and partial records.
- No empty header row with the default configuration.
- Deterministic core with no import-time state (the filename timestamp bug is gone).
- Consistent handling of `-Infinity` and `NaN`.

**Tooling**

- Dual ESM and CJS build with type declarations (tsup), TypeScript 6, Vitest with
  coverage, ESLint, and Prettier. Zero runtime dependencies.
