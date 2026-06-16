---
description: Select, order, and rename CSV columns, checked against your record type.
---

# Choosing columns

One `columns` option selects, orders, and labels columns. Keys are checked
against your type, so a typo will not compile.

```ts
// An array of keys: each key is also its header.
stringify(users, { columns: ['name', 'email'] });
// name,email
// Alex Johnson,alex@example.com

// A map of key to label: also sets the header text.
stringify(users, { columns: { name: 'Full name', email: 'Email address' } });
// Full name,Email address
// Alex Johnson,alex@example.com
```

Without `columns`, the columns are the stable union of every record's keys, in
first-seen order, so reordered or partial records never shift.

A map orders columns by JavaScript object key order: integer-like keys (`"0"`,
`"1"`, ...) come first in ascending numeric order, then the rest in insertion
order. If your keys are integer-like and the order matters, use the array form,
which always keeps the order you write.

::: tip
A missing key and an explicit `undefined` are treated the same. Declaring
`columns` also makes [streaming](./streaming) fully incremental, since the header
is known up front.
:::
