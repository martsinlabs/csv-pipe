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
stringify(rows, { sanitizeFormulas: true });
// A cell like =1+1 is written as '=1+1, so the spreadsheet shows it literally.
```

It prefixes any string or array cell that begins with a formula character so the
value is shown literally. Numbers, booleans, and dates are never altered. The
prefix defaults to a single quote and can be changed with `formulaPrefix`:

```ts
stringify(rows, { sanitizeFormulas: true, formulaPrefix: '\t' });
```

On the parsing side a cell that looks like a formula (for example `=1+1`) is
returned as a plain string; csv-pipe never evaluates it. The guard matters when
you re-export parsed, untrusted data, so set `sanitizeFormulas` on that export.

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](https://github.com/martsinlabs/csv-pipe/security/advisories/new),
not as a public issue. See the
[security policy](https://github.com/martsinlabs/csv-pipe/blob/master/SECURITY.md)
for details.
