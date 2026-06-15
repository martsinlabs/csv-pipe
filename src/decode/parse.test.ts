import { describe, expect, it } from 'vitest';
import { CsvPipeError } from '../errors';
import { parse } from './parse';

describe('parse', () => {
  it('infers objects from the header row by default', () => {
    expect(parse('name,age\nAda,36\nGrace,45')).toEqual([
      { name: 'Ada', age: '36' },
      { name: 'Grace', age: '45' }
    ]);
  });

  it('returns raw string rows when header is false', () => {
    expect(parse('a,b\nc,d', { header: false })).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });

  it('reads quoted fields with separators, quotes, and newlines', () => {
    expect(parse('a,b\n"x,y","he said ""hi"""')).toEqual([
      { a: 'x,y', b: 'he said "hi"' }
    ]);
    expect(parse('a\n"line1\nline2"')).toEqual([{ a: 'line1\nline2' }]);
  });

  it('coerces values losslessly only when dynamicTyping is on', () => {
    expect(parse('n,b,z\n42,true,007', { dynamicTyping: true })).toEqual([
      { n: 42, b: true, z: '007' }
    ]);
    expect(parse('n\n1.50', { dynamicTyping: true })).toEqual([{ n: '1.50' }]);
    expect(parse('n\n42')).toEqual([{ n: '42' }]);
  });

  it('skips empty lines by default', () => {
    expect(parse('a\n1\n\n2')).toEqual([{ a: '1' }, { a: '2' }]);
  });

  it('skips comment lines', () => {
    expect(parse('a\n1\n# note\n2', { comment: '#' })).toEqual([
      { a: '1' },
      { a: '2' }
    ]);
  });

  it('trims field values when asked', () => {
    expect(parse(' a , b \n 1 , 2 ', { trim: true })).toEqual([
      { a: '1', b: '2' }
    ]);
  });

  it('strips a leading BOM', () => {
    expect(parse('﻿a\n1')).toEqual([{ a: '1' }]);
  });

  it('pads short rows and ignores extra fields when lenient', () => {
    expect(parse('a,b\n1')).toEqual([{ a: '1', b: '' }]);
    expect(parse('a,b\n1,2,3')).toEqual([{ a: '1', b: '2' }]);
  });

  it('throws on a ragged row in strict mode', () => {
    expect(() => parse('a,b\n1', { strict: true })).toThrow(CsvPipeError);
  });

  it('honors a custom separator and maxRows', () => {
    expect(parse('a;b\n1;2\n3;4', { separator: ';', maxRows: 1 })).toEqual([
      { a: '1', b: '2' }
    ]);
  });

  it('maps records through the row hook', () => {
    const rows = parse<{ id: number }>('id\n1\n2', {
      row: (record) => ({ id: Number(record.id) })
    });
    expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('greedy skipEmptyLines drops whitespace-only lines', () => {
    expect(parse('a\n1\n   \n2', { skipEmptyLines: 'greedy' })).toEqual([
      { a: '1' },
      { a: '2' }
    ]);
  });

  it('returns no rows for maxRows: 0', () => {
    expect(parse('a\n1\n2\n3', { maxRows: 0 })).toEqual([]);
  });

  it('keeps non-finite values as strings under dynamicTyping', () => {
    expect(
      parse('n,m,k\nInfinity,-Infinity,NaN', { dynamicTyping: true })
    ).toEqual([{ n: 'Infinity', m: '-Infinity', k: 'NaN' }]);
  });

  it('rejects a multi-character separator', () => {
    expect(() => parse('a\n1', { separator: '::' })).toThrow(CsvPipeError);
  });
});
