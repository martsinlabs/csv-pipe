---
description: Every csv-pipe parsing option, with examples for separators, empty lines, comments, strict mode, and BOM.
---

# Parsing options

Every option is optional.

| Option           | Type                              | Default | Description                                           |
| ---------------- | --------------------------------- | ------- | ----------------------------------------------------- |
| `header`         | `boolean`                         | `true`  | Use the first row as keys; `false` yields `string[]`. |
| `columns`        | `(keyof T)[]` or label-to-key map | none    | Name, select, or rename columns.                      |
| `separator`      | `string` or `'auto'`              | `,`     | Field separator, or detect it.                        |
| `quote`          | `string`                          | `"`     | Quote character.                                      |
| `skipEmptyLines` | `boolean \| 'greedy'`             | `true`  | Drop blank (or whitespace-only) lines.                |
| `comment`        | `string`                          | none    | Skip lines starting with this.                        |
| `trim`           | `boolean`                         | `false` | Trim whitespace around every field.                   |
| `bom`            | `boolean`                         | auto    | Strip a leading UTF-8 byte-order mark.                |
| `dynamicTyping`  | `boolean`                         | `false` | Coerce numbers and booleans losslessly.               |
| `strict`         | `boolean`                         | `false` | Throw on a row whose field count differs.             |
| `maxRows`        | `number`                          | none    | Stop after this many records.                         |
| `row`            | `(record, context) => T`          | none    | Map or validate each record.                          |

`header` and `columns` are covered in [Choosing columns](./parsing-columns);
`dynamicTyping` and `row` in [Typing and validation](./parsing-typing). The rest
are below.

## Separator and quote

`separator` is a single character, or `'auto'` to detect it. Detection reads the
first line that is neither blank nor a comment, so metadata or comment lines
above the header never skew it. It considers comma, semicolon, tab, and pipe, and
ignores any of them inside quotes. It also works while streaming, buffering only
up to that first line.

```ts
parse('a;b\n1;2', { separator: 'auto' });
// [{ a: '1', b: '2' }] — detects ; from , ; tab |
```

`quote` sets the quote character (default `"`). Doubled quotes inside a quoted
field are unescaped per RFC 4180.

## Empty lines and comments

`skipEmptyLines` is `true` by default, dropping fully blank lines. Use `'greedy'`
to also drop lines that contain only whitespace, or `false` to keep every line.

```ts
parse('a\n1\n   \n2', { skipEmptyLines: 'greedy' });
// [{ a: '1' }, { a: '2' }]
```

`comment` skips any line whose first field begins with the given string. The
first field is checked after quotes are parsed, so a quoted first field that
starts with the comment string also counts as a comment.

```ts
parse('a\n1\n# note\n2', { comment: '#' });
// [{ a: '1' }, { a: '2' }]
```

## Whitespace

`trim` removes surrounding whitespace from every field. It applies to quoted
fields too, so leave it off when whitespace inside quotes is significant.

```ts
parse(' a , b \n 1 , 2 ', { trim: true });
// [{ a: '1', b: '2' }]
```

## Strict mode

By default parsing is lenient: a short row pads missing fields with `''` and
extra fields are dropped. `strict` instead throws a `CsvPipeError` naming the row
whose field count differs from the header. The number is the 1-based row in the
source, where the header is row 1 (a quoted field spanning newlines counts as one
row).

```ts
parse('a,b\n1', { strict: true });
// throws CsvPipeError: Row 2 has 1 fields, expected 2.
```

## Limiting and BOM

`maxRows` stops after that many records, which pairs well with streaming a large
file to sample the start. `bom` strips a leading UTF-8 byte-order mark when
present; set it to `false` to keep one.

```ts
parse('a\n1\n2\n3', { maxRows: 2 });
// [{ a: '1' }, { a: '2' }]
```

See the [API reference](/api/csv-pipe/interfaces/CsvParseOptions) for the typed
definitions.
