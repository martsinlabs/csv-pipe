---
description: Select, rename, and position columns when parsing CSV into typed records.
---

# Choosing columns when parsing

The `columns` option names, selects, and renames the columns a parse emits,
checked against your record type. It is the parsing side of the
[encoder's columns](./columns).

## Name headerless rows by position

An array of keys turns each `string[]` row into an object, by position. It works
with `header: false`:

```ts
parse('1,2\n3,4', { header: false, columns: ['x', 'y'] });
// [{ x: '1', y: '2' }, { x: '3', y: '4' }]
```

With `header: true` the CSV header row is dropped in favor of your keys, so you
control the names whatever the file calls them:

```ts
parse('name,age\nAda,36', { columns: ['n', 'a'] });
// [{ n: 'Ada', a: '36' }]
```

## Rename and select with a label map

A map of CSV header label to your key renames and selects columns. Labels not in
the map are dropped, so you can normalize a messy header into exactly your shape.
A rename map requires `header: true`.

```ts
parse('Full Name,Email,extra\nAda,a@b.com,x', {
  columns: { 'Full Name': 'name', Email: 'email' }
});
// [{ name: 'Ada', email: 'a@b.com' }] — "extra" is dropped
```

The keys you map to are checked against `T` in `parse<T>` and
`createCsvParser<T>`, so a typo will not compile.
