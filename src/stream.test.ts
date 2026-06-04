import { describe, expect, it } from 'vitest';
import { createCsvEncoder } from './core/encoder';
import { toReadableStream } from './stream';

interface Row {
  name: string;
  age: number;
}

const rows: Row[] = [
  { name: 'Alex', age: 29 },
  { name: 'Sam', age: 24 }
];

async function readAll(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  let output = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    output += value;
  }
  return output;
}

describe('toReadableStream', () => {
  it('adapts an encoder stream into a Web ReadableStream', async () => {
    const toCsv = createCsvEncoder<Row>();
    const output = await readAll(toReadableStream(toCsv.stream(rows)));
    expect(output).toBe(toCsv(rows));
  });

  it('forwards cancellation to the source iterator', async () => {
    let cleanedUp = false;
    async function* source(): AsyncGenerator<Row> {
      try {
        for (const record of rows) yield record;
      } finally {
        cleanedUp = true;
      }
    }

    const toCsv = createCsvEncoder<Row>({ columns: ['name', 'age'] });
    const reader = toReadableStream(toCsv.stream(source())).getReader();
    await reader.read(); // header
    await reader.read(); // first record, source iteration started
    await reader.cancel();

    expect(cleanedUp).toBe(true);
  });
});
