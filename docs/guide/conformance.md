---
description: csv-pipe is verified with a curated edge-case corpus, the external csv-spectrum suite, and property-based testing, all in CI.
---

# Conformance

CSV looks simple, but it is full of edge cases. csv-pipe handles them, and three
layers of tests run on every commit.

## A curated corpus

Over 70 cases, each paired with its expected output. They include what trips
parsers up: quoted commas and line breaks inside a field,
doubled quotes, byte-order marks, the various line endings, ragged rows, and
Unicode.

A small sample, shown with `header: false` so each row is a plain array:

| Input                | Parsed                   |
| -------------------- | ------------------------ |
| `a,"b,c",d`          | `["a", "b,c", "d"]`      |
| `"a""b"`             | `['a"b']`                |
| `"line 1\nline 2"`   | `["line 1\nline 2"]`     |
| `a,b\r\nc,d` (CRLF)  | `["a","b"]`, `["c","d"]` |
| `a\rb` (lone CR)     | `["a"]`, `["b"]`         |
| `a,,c`               | `["a", "", "c"]`         |
| `"a"junk,b`          | `["a", "b"]`             |
| `"ab` (unterminated) | `["ab"]`                 |
| `﻿a,b` (leading BOM) | `["a", "b"]`             |
| `café,日本,😀`       | `["café", "日本", "😀"]` |

The full set lives in
[`conformance.cases.ts`](https://github.com/martsinlabs/csv-pipe/blob/master/src/decode/conformance.cases.ts).

## The csv-spectrum suite

csv-pipe also passes
[csv-spectrum](https://github.com/maxogden/csv-spectrum), a widely used
third-party CSV test suite.

## Property-based testing

Examples only reach the cases we anticipated. For the rest,
[fast-check](https://fast-check.dev/) runs a few properties over thousands of
random inputs:

- **It never throws.** Any string produces a well-formed result.
- **It round-trips.** Encoding data and reading it back returns the original,
  even with commas, quotes, and newlines in the fields.
- **It is unaffected by chunking.** The same input split into varying chunk sizes
  parses identically to the whole.

## Ambiguous inputs

A few inputs have no single right answer, so here is what csv-pipe does:

- It is forgiving by default: a short row is padded, a long row loses the extras,
  anything after a closing quote is ignored, and an unterminated quote runs to
  the end. Switch on [`strict`](./parsing-options#strict-mode) to reject
  malformed rows.
- `trim` strips whitespace from every field, quoted ones included.
- A line that is only an empty quoted field (`""`) becomes one empty field. The
  default `skipEmptyLines` drops it with the blanks; `skipEmptyLines: false`
  keeps it.

See [Options](./parsing-options) for each setting in full.

## Run it yourself

```sh
git clone https://github.com/martsinlabs/csv-pipe
cd csv-pipe
npm install
npm test
```
