---
description: Handle CsvPipeError and prevent unencodable cell values with the format hook.
---

# Error handling

csv-pipe throws a single error type, `CsvPipeError`, which extends `Error`. It
is also exported, so you can catch it precisely.

## When it throws

`CsvPipeError` is the only error csv-pipe raises by design, on both sides:

**Encoding**

- A value cannot be a cell. A CSV cell must be a string, number, boolean,
  bigint, `null`, `undefined`, or an array of those. A plain object, a function,
  a symbol, or an invalid `Date` throws, and the message names the row and
  column.
- `separator` or `quote` is not a single character.

**Parsing**

- `separator` or `quote` is not a single character.
- A `columns` rename map is given without `header: true`.
- `strict` is on and a row's field count differs from the header. The message
  names the 1-based source row, where the header is row 1.

```ts
import { stringify } from 'csv-pipe';

stringify([{ a: 1 }, { a: { nested: true } }]);
// CsvPipeError: Cannot encode an object at row 1, column "a".
// A CSV cell must be a string, number, boolean, bigint, null, undefined,
// or an array of those.
```

## Handling it

Catch `CsvPipeError` to distinguish it from other failures.

```ts
import { stringify, CsvPipeError } from 'csv-pipe';

try {
  return stringify(rows);
} catch (error) {
  if (error instanceof CsvPipeError) {
    // a cell value was not encodable; the message names the row and column
  }
  throw error;
}
```

## Preventing it

Use the [`format`](./formatting) hook to turn rich values into something
encodable before they reach a cell, for example serializing nested objects:

```ts
stringify(rows, {
  format: (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? JSON.stringify(value)
      : value
});
```
