---
description: Typed CSV encoding and parsing with columns checked against your data and inferred types on hover.
---

# TypeScript

csv-pipe is written in TypeScript and ships its own types. There is no `any` in
the public surface, and your record type drives the API.

Hover any token in the examples below to see the inferred types.

## Typing your records

Pass any object type. `stringify` and `createCsvEncoder` infer the element type,
so columns and the `format` hook are typed against it.

```ts twoslash
import { stringify } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [{ name: 'Ada', email: 'ada@example.com', age: 36 }];

const csv = stringify(users);
//    ^?
```

## Columns are checked against your type

`columns` accepts the keys of your record, or a map of key to header label.
A key that does not exist is a compile error.

```ts twoslash
// @errors: 2820
import { stringify } from 'csv-pipe';
type User = { name: string; email: string; age: number };
const users: User[] = [{ name: 'Ada', email: 'ada@example.com', age: 36 }];
// ---cut---
stringify(users, { columns: ['name', 'emial'] });
```

So a renamed or removed field surfaces at compile time, across every call site,
instead of producing a file with an empty column.

## A reusable, typed encoder

`createCsvEncoder<T>` returns an encoder bound to your type, with typed `row` and
`stream`.

```ts twoslash
import { createCsvEncoder } from 'csv-pipe';
type User = { name: string; email: string; age: number };
const users: User[] = [{ name: 'Ada', email: 'ada@example.com', age: 36 }];
// ---cut---
const toCsv = createCsvEncoder<User>({ columns: ['name', 'email'] });

toCsv(users);
toCsv.row(users[0]);
```

## Typed parsing

Parsing is typed too. `parse<T>` and `createCsvParser<T>` infer the record type,
and `columns` is checked against it, just as with encoding. See
[Typing and validation](./parsing-typing) for dynamic typing and runtime
validation.

## Exported types

```ts
import type {
  CsvOptions,
  CsvColumns,
  CsvEncoder,
  CsvRecord,
  CsvInput,
  CsvCell,
  CsvPrimitive,
  QuotingMode,
  BooleanStyle,
  CsvFormatter,
  CsvFormatContext
} from 'csv-pipe';
```

The `CsvPipeError` class is also exported as a value. See the
[API reference](/api/) for each definition.
