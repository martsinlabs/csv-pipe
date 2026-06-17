---
description: Guard CSV exports against spreadsheet formula injection with one option.
---

# Security

## Formula injection

csv-pipe produces RFC 4180-compliant text. By default it does not neutralize
values that a spreadsheet application may interpret as a formula (for example a
cell beginning with `=`, `+`, `-`, `@`, a tab, or a carriage return).

When you export untrusted data for use in spreadsheets, enable the built-in
guard:

```ts
stringify([{ note: '=1+1' }], { sanitizeFormulas: true });
// note
// '=1+1   (the leading quote makes a spreadsheet show the cell literally)
```

It prefixes any string or array cell that begins with a formula character so the
value is shown literally. Numbers, booleans, and dates are never altered. The
prefix defaults to a single quote and can be changed with `formulaPrefix`:

```ts
stringify([{ note: '=1+1' }], { sanitizeFormulas: true, formulaPrefix: '\t' });
// note
// \t=1+1   (prefixed with a tab instead of a quote)
```

On the parsing side a cell that looks like a formula (for example `=1+1`) is
returned as a plain string; csv-pipe never evaluates it. The guard matters when
you re-export parsed, untrusted data, so set `sanitizeFormulas` on that export.

## Resource safety

Parsing holds one record in memory at a time, so the size of the input alone
cannot exhaust memory, whether it arrives as a file, an upload, or a network
body. Stop early with `break` or `maxRows` and csv-pipe releases the source at
once, cancelling a Web `ReadableStream` or closing a Node file handle. See
[Streaming and files](./parsing-streaming).

## Reporting a vulnerability

Please report security issues privately through
[private vulnerability reporting](https://github.com/martsinlabs/csv-pipe/security/advisories/new)
on GitHub, not as a public issue. See the
[security policy](https://github.com/martsinlabs/csv-pipe/blob/master/SECURITY.md)
for details.
