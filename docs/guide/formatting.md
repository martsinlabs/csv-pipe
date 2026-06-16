---
description: Transform values before encoding with the format hook, including dates and numbers.
---

# Formatting values

A `Date` renders as an ISO string out of the box. For anything else (custom
number formats, nested objects), pass a `format` function. It receives each
value and its location, and returns whatever should be encoded; return the value
unchanged to pass it through.

```ts
type Order = { id: number; total: number; placedAt: Date };

stringify(orders, {
  format: (value) => (typeof value === 'number' ? value.toFixed(2) : value)
});
// id,total,placedAt
// 1.00,19.50,2026-06-04T10:00:00.000Z
// 2.00,4.00,2026-06-05T12:30:00.000Z
```

The hook receives a context with the column key and the row index, so you can
format per column:

```ts
stringify(orders, {
  format: (value, { column }) =>
    column === 'total' && typeof value === 'number'
      ? `$${value.toFixed(2)}`
      : value
});
```

## Non-cell values

A value that cannot be a cell (a plain object, function, symbol, or an invalid
`Date`) throws a `CsvPipeError` that names the row and column. Use `format` to
turn such values into something encodable, for example `JSON.stringify`.
