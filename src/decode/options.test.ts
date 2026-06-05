import { describe, expect, it } from 'vitest';
import { createCsvParser } from '../core/parser';
import { CsvPipeError } from '../errors';
import { parse } from './parse';

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const value of source) out.push(value);
  return out;
}

describe('columns', () => {
  it('names headerless rows by position', () => {
    expect(parse('1,2\n3,4', { header: false, columns: ['a', 'b'] })).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' }
    ]);
  });

  it('drops the CSV header in favor of positional keys', () => {
    expect(parse('name,age\nAda,36', { columns: ['n', 'a'] })).toEqual([
      { n: 'Ada', a: '36' }
    ]);
  });

  it('renames and selects columns with a label map', () => {
    expect(
      parse('Full Name,Email,extra\nAda,a@b,x', {
        columns: { 'Full Name': 'name', Email: 'email' }
      })
    ).toEqual([{ name: 'Ada', email: 'a@b' }]);
  });

  it('rejects a rename map without a header', () => {
    expect(() => parse('1\n2', { header: false, columns: { a: 'x' } })).toThrow(
      CsvPipeError
    );
  });
});

describe('separator auto-detect', () => {
  it('detects the delimiter from the first row', () => {
    expect(parse('a;b\n1;2', { separator: 'auto' })).toEqual([
      { a: '1', b: '2' }
    ]);
    expect(parse('a\tb\n1\t2', { separator: 'auto' })).toEqual([
      { a: '1', b: '2' }
    ]);
    expect(parse('a|b\n1|2', { separator: 'auto' })).toEqual([
      { a: '1', b: '2' }
    ]);
    expect(parse('a,b\n1,2', { separator: 'auto' })).toEqual([
      { a: '1', b: '2' }
    ]);
  });

  it('ignores candidates inside quotes when detecting', () => {
    expect(parse('"a;b",c\n1,2', { separator: 'auto' })).toEqual([
      { 'a;b': '1', c: '2' }
    ]);
  });

  it('detects across chunk boundaries when streaming', async () => {
    const parser = createCsvParser({ separator: 'auto' });
    const rows = await collect(parser.stream(['a;', 'b\n1;2\n3;4']));
    expect(rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' }
    ]);
  });
});
