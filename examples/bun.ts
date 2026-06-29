// Round-trip a dataset through CSV on Bun: encode an array of objects with
// `stringify`, then read the text back into records with `parse`. The library is
// runtime-agnostic, so this is the same code you would run on Node; only the
// runner differs. Run it with `bun examples/bun.ts`.
import { parse, stringify } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];

// Encode the records into a single CSV string.
const csv = stringify(users);
console.log(csv);
// name,email,age
// Alex Johnson,alex@example.com,29
// Carlos Herrera,carlos@example.com,24

// Parse the text back. With the default `header: true`, the first row supplies
// the keys. CSV is text, so every field comes back as a string (age is "29").
const records = parse(csv);
console.log(records);
// [
//   { name: 'Alex Johnson', email: 'alex@example.com', age: '29' },
//   { name: 'Carlos Herrera', email: 'carlos@example.com', age: '24' }
// ]
