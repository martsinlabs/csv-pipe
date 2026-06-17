// Stream a large dataset to a file with flat memory. writeCsv handles the
// piping; for finer control you can build the Readable yourself.
import { createCsvEncoder } from 'csv-pipe';
import { writeCsv } from 'csv-pipe/node';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';

type Row = { id: number; value: number };

function* rows(count: number): Generator<Row> {
  for (let id = 1; id <= count; id += 1) {
    yield { id, value: id * id };
  }
}

// The simple path: encode and write in one call.
await writeCsv('squares.csv', rows(100_000), { columns: ['id', 'value'] });

// The explicit path: build a Node Readable from the chunk stream yourself.
const encoder = createCsvEncoder<Row>({ columns: ['id', 'value'] });
const readable = Readable.from(encoder.stream(rows(100_000)));
readable.pipe(createWriteStream('squares-explicit.csv'));
