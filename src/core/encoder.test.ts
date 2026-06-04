import { describe, expect, it } from 'vitest';
import { createCsvEncoder } from './encoder';

interface Row {
  name: string;
  age: number;
}

const rows: Row[] = [
  { name: 'Alex', age: 29 },
  { name: 'Sam', age: 24 }
];

describe('createCsvEncoder', () => {
  it('is callable and encodes the full document', () => {
    const toCsv = createCsvEncoder<Row>();
    expect(toCsv(rows)).toBe('name,age\r\nAlex,29\r\nSam,24');
  });

  it('encodes a single record without a header via row()', () => {
    const toCsv = createCsvEncoder<Row>({ columns: ['name', 'age'] });
    expect(toCsv.row(rows[0]!)).toBe('Alex,29');
  });

  it('selects, orders and labels columns from a map', () => {
    const toCsv = createCsvEncoder<Row>({
      columns: { age: 'Age', name: 'Name' }
    });
    expect(toCsv(rows)).toBe('Age,Name\r\n29,Alex\r\n24,Sam');
  });

  it('resolves options once and reuses them across calls', () => {
    const toCsv = createCsvEncoder<Row>({ separator: ';' });
    expect(toCsv([rows[0]!])).toBe('name;age\r\nAlex;29');
    expect(toCsv([rows[1]!])).toBe('name;age\r\nSam;24');
  });

  it('streams chunks that concatenate to the full document', async () => {
    const toCsv = createCsvEncoder<Row>({ bom: true });
    let streamed = '';
    for await (const chunk of toCsv.stream(rows)) streamed += chunk;
    expect(streamed).toBe(toCsv(rows));
  });

  it('streams from an async iterable input', async () => {
    const toCsv = createCsvEncoder<Row>();
    async function* source(): AsyncGenerator<Row> {
      yield rows[0]!;
      yield rows[1]!;
    }
    let streamed = '';
    for await (const chunk of toCsv.stream(source())) streamed += chunk;
    expect(streamed).toBe(toCsv(rows));
  });

  it('streams incrementally when columns are declared', async () => {
    const toCsv = createCsvEncoder<Row>({ columns: ['name', 'age'] });
    let streamed = '';
    for await (const chunk of toCsv.stream(rows)) streamed += chunk;
    expect(streamed).toBe(toCsv(rows));
  });

  it('emits the header before pulling any record with declared columns', async () => {
    const toCsv = createCsvEncoder<Row>({ columns: ['name', 'age'] });
    let pulled = 0;
    async function* source(): AsyncGenerator<Row> {
      for (const record of rows) {
        pulled += 1;
        yield record;
      }
    }

    const iterator = toCsv.stream(source())[Symbol.asyncIterator]();
    const first = await iterator.next();

    expect(first.value).toBe('name,age');
    expect(pulled).toBe(0);

    await iterator.return?.(undefined);
  });
});
