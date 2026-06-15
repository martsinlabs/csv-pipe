import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createCsvParser } from '../core/parser';
import { stringify } from '../encode/stringify';

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const value of source) out.push(value);
  return out;
}

function chunkBySizes(text: string, sizes: readonly number[]): string[] {
  const chunks: string[] = [];
  let index = 0;
  let step = 0;
  while (index < text.length) {
    const size = sizes[step % sizes.length]!;
    chunks.push(text.slice(index, index + size));
    index += size;
    step += 1;
  }
  return chunks;
}

function readableFrom(
  chunks: readonly (string | Uint8Array)[]
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    }
  });
}

describe('parser.stream', () => {
  it('parses a string source', async () => {
    const parser = createCsvParser();
    expect(await collect(parser.stream('a,b\n1,2\n3,4'))).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' }
    ]);
  });

  it('matches sync parse for any chunking of the input', async () => {
    const record = fc.record({ a: fc.string(), b: fc.string() });
    await fc.assert(
      fc.asyncProperty(
        fc.array(record, { minLength: 1 }),
        fc.array(fc.integer({ min: 1, max: 6 }), { minLength: 1 }),
        async (records, sizes) => {
          const csv = stringify(records);
          const parser = createCsvParser({ skipEmptyLines: false });
          const streamed = await collect(
            parser.stream(chunkBySizes(csv, sizes))
          );
          expect(streamed).toEqual(records);
        }
      )
    );
  });

  it('decodes byte chunks, even when a multibyte char is split', async () => {
    const csv = 'a\ncafé😀';
    const bytes = new TextEncoder().encode(csv);
    const singleByteChunks = Array.from(
      bytes,
      (byte) => new Uint8Array([byte])
    );
    const parser = createCsvParser();
    expect(await collect(parser.stream(singleByteChunks))).toEqual([
      { a: 'café😀' }
    ]);
  });

  it('reads from a Web ReadableStream', async () => {
    const parser = createCsvParser();
    const stream = readableFrom(['a,b\n1,', '2\n3,4']);
    expect(await collect(parser.stream(stream))).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' }
    ]);
  });

  it('honors options through the stream', async () => {
    const rows = await collect(
      createCsvParser({ header: false }).stream(['a,b', '\nc,d'])
    );
    expect(rows).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);

    const limited = await collect(
      createCsvParser({ maxRows: 1 }).stream('a\n1\n2\n3')
    );
    expect(limited).toEqual([{ a: '1' }]);
  });

  it('ignores stray characters after a closing quote, split across chunks', async () => {
    const rows = await collect(
      createCsvParser({ header: false }).stream(['"x"ju', 'nk,y'])
    );
    expect(rows).toEqual([['x', 'y']]);
  });

  it('yields no rows for maxRows: 0', async () => {
    const rows = await collect(
      createCsvParser({ maxRows: 0 }).stream('a\n1\n2')
    );
    expect(rows).toEqual([]);
  });

  it('closes a quoted field right before a line break (LF and CRLF)', async () => {
    const rows = await collect(
      createCsvParser({ header: false }).stream('"a"\n"b"\r\nc')
    );
    expect(rows).toEqual([['a'], ['b'], ['c']]);
  });
});
