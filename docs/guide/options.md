---
description: Every csv-pipe option, with worked examples for TSV, quoting, BOM, booleans, and arrays.
---

# Options

Every option is optional.

| Option             | Type                                       | Default                            | Description                                                                                          |
| ------------------ | ------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `columns`          | `(keyof T)[]` or `Record<keyof T, string>` | union of record keys               | Columns to emit: an array of keys, or a map of key to header label.                                  |
| `showHeaders`      | `boolean`                                  | `true`                             | Whether to emit a header row.                                                                        |
| `separator`        | `string`                                   | `,`                                | Field separator. One character.                                                                      |
| `quote`            | `string`                                   | `"`                                | Quote character used when a field must be quoted. One character.                                     |
| `newline`          | `string`                                   | `\r\n`                             | Line terminator between records.                                                                     |
| `finalNewline`     | `boolean`                                  | `false`                            | Append a trailing newline after the last record.                                                     |
| `quoting`          | `'minimal' \| 'all' \| 'non-numeric'`      | `minimal`                          | `minimal` quotes only when required; `all` quotes every field; `non-numeric` quotes all but numbers. |
| `format`           | `(value, context) => unknown`              | none                               | Transform each value before it is encoded.                                                           |
| `nullText`         | `string`                                   | `""`                               | Text for `null`.                                                                                     |
| `undefinedText`    | `string`                                   | `""`                               | Text for `undefined`.                                                                                |
| `nanText`          | `string`                                   | `""`                               | Text for `NaN`.                                                                                      |
| `infinityText`     | `string`                                   | `Infinity`                         | Text for `Infinity`; `-Infinity` becomes `-` followed by this.                                       |
| `booleans`         | `{ true: string; false: string }`          | `{ true: 'true', false: 'false' }` | Text for boolean values.                                                                             |
| `arraySeparator`   | `string`                                   | `, `                               | Separator used to join an array within a single cell.                                                |
| `bom`              | `boolean`                                  | `false`                            | Prepend a UTF-8 byte-order mark, which helps some spreadsheet apps.                                  |
| `sanitizeFormulas` | `boolean`                                  | `false`                            | Guard string and array cells against spreadsheet formula injection.                                  |
| `formulaPrefix`    | `string`                                   | `'`                                | Prefix applied by `sanitizeFormulas`.                                                                |

## Behavior

- `separator` and `quote` must be a single character, matching the parser, so
  encoded output round-trips. A non-single-character value throws a `CsvPipeError`.
- A quoted field escapes an embedded quote by doubling it, per RFC 4180.
- `null`, `undefined`, and `NaN` render as an empty string by default.
- A missing key and an explicit `undefined` are treated the same.
- An array value is joined into one cell using `arraySeparator`.
- A `Date` renders as an ISO 8601 string.
- A value that cannot be a cell (a plain object, function, or symbol) throws a
  `CsvPipeError` that names the row and column. Use `format` to handle such
  values.
- With `sanitizeFormulas`, any string or array cell that begins with a formula
  character (`=`, `+`, `-`, `@`, a tab, or a carriage return) is prefixed so a
  spreadsheet shows it literally.

## Examples

### Tab-separated values

Set `separator` to a tab for TSV output.

```ts
stringify([{ a: 1, b: 'x' }], { separator: '\t' });
// a	b
// 1	x
```

### Quoting strategy

`minimal` (the default) quotes only when a field contains the separator, a
quote, or a line break. `all` quotes every field; `non-numeric` quotes
everything except numbers and bigints.

```ts
stringify([{ a: 1, b: 'x' }], { quoting: 'all' });
// "a","b"
// "1","x"

stringify([{ a: 1, b: 'x' }], { quoting: 'non-numeric' });
// "a","b"
// 1,"x"
```

### Excel-friendly UTF-8 BOM

Some spreadsheet apps need a byte-order mark to read UTF-8 correctly. `bom`
prepends one.

```ts
stringify(rows, { bom: true });
```

### Custom booleans and empty values

```ts
stringify([{ active: true, note: null }], {
  booleans: { true: 'yes', false: 'no' },
  nullText: 'N/A'
});
// active,note
// yes,N/A
```

### Arrays in one cell

An array value is joined into a single cell with `arraySeparator`.

```ts
stringify([{ tags: ['a', 'b', 'c'] }], { arraySeparator: ' | ' });
// tags
// a | b | c
```

See the [API reference](/api/csv-pipe/interfaces/CsvOptions) for the typed option
definitions.
