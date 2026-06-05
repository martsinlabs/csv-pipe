# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 2.x     | Yes       |
| < 2.0   | No        |

## Reporting a vulnerability

Please report security issues privately, not as a public issue. Open a draft
advisory through GitHub's private vulnerability reporting:

https://github.com/martsinlabs/csv-pipe/security/advisories/new

Include a description, a minimal reproduction, and the affected version. You can
expect an initial response within a few days, and we will keep you updated until
the issue is resolved and disclosed.

## CSV formula injection

csv-pipe produces RFC 4180-compliant text. By default it does not neutralize
values that a spreadsheet application may interpret as a formula (for example a
cell beginning with `=`, `+`, `-`, `@`, a tab, or a carriage return).

When you export untrusted data for use in spreadsheets, enable the built-in
guard:

```ts
stringify(rows, { sanitizeFormulas: true });
```

It prefixes any string or array cell that leads with a formula character so the
value is shown literally. Numbers, booleans, and dates are never altered. The
prefix defaults to a single quote and can be changed with `formulaPrefix`.
