// Run with: deno run examples/deno.ts
import { parse, stringify } from 'npm:csv-pipe';

type User = { name: string; email: string; age: number };

const users: User[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', age: 29 },
  { name: 'Carlos Herrera', email: 'carlos@example.com', age: 24 }
];

const csv = stringify(users);
console.log('--- Encoded ---');
console.log(csv);

const parsed = parse<User>(csv);
console.log('\n--- Parsed ---');
console.log(parsed);
