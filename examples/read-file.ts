// Read and parse a CSV file as a stream of typed records, with flat memory.
// readCsv is the mirror of writeCsv: the file is decoded incrementally, so a
// file of any size is never fully loaded.
import { readCsv } from 'csv-pipe/node';

type User = { name: string; email: string; age: string };

for await (const user of readCsv<User>('users.csv')) {
  // one record at a time
  console.log(user.name, user.email);
}
