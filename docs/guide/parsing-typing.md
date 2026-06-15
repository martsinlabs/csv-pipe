---
description: Coerce parsed values losslessly with dynamic typing, and enforce types at runtime with the row hook.
---

# Typing and validation

Parsed fields are strings by default, and `parse<T>` is a type assertion, like
`JSON.parse(...) as T`: it shapes the result type but does not change values at
runtime. Two options bridge that gap.

## Dynamic typing

Off by default. When on, a value is coerced to a number or boolean only when it
round-trips exactly, so no data is silently lost. Only finite numbers are
coerced.

```ts
parse('id,active\n42,true', { dynamicTyping: true });
// [{ id: 42, active: true }]
```

| Field      | With `dynamicTyping`  | Why                           |
| ---------- | --------------------- | ----------------------------- |
| `42`       | `42` (number)         | round-trips exactly           |
| `true`     | `true` (boolean)      | recognized literal            |
| `007`      | `"007"` (string)      | would lose the leading zero   |
| `1.50`     | `"1.50"` (string)     | would lose the trailing zero  |
| `1e3`      | `"1e3"` (string)      | would not round-trip to `1e3` |
| `Infinity` | `"Infinity"` (string) | not a finite number           |

Because typing is per field, it is best for known-numeric data. For full control,
use the row hook below.

## Validation with the row hook

For real runtime safety, pass a `row` hook. It receives each raw record and
returns the final element, so a schema library or a hand-written guard enforces
the type. This is the parsing analogue of the encoder's
[`format`](./formatting) hook.

```ts
import { parse } from 'csv-pipe';

const users = parse('id\n1\n2', {
  row: (record) => ({ id: Number(record.id) })
});
// [{ id: 1 }, { id: 2 }]
```

The hook also receives a context with the record's zero-based `rowIndex`, useful
for error messages:

```ts
parse('email\na@b.com', {
  row: (record, { rowIndex }) => {
    if (!record.email.includes('@')) {
      throw new Error(`Invalid email on row ${rowIndex}`);
    }
    return record;
  }
});
```

A schema library fits the same slot. For example, with a validator that exposes a
`parse` method, return `schema.parse(record)` from the hook to get validated,
fully typed records.
