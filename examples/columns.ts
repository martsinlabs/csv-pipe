// Select, order, and label columns with one option. Keys are checked against
// the record type, so a typo is a compile error.
import { stringify } from 'csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];

// An array of keys: each key is also its header.
console.log(stringify(users, { columns: ['name', 'email'] }));
// name,email
// Alex Johnson,alex@example.com
// Carlos Herrera,carlos@example.com

// A map of key to label: also sets the header text.
console.log(
  stringify(users, { columns: { name: 'Full name', email: 'Email address' } })
);
// Full name,Email address
// Alex Johnson,alex@example.com
// Carlos Herrera,carlos@example.com
