import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { CsvPipeError } from '../errors';
import type { CsvRecord } from '../types';
import { stringify } from './stringify';

describe('stringify', () => {
  it('emits a header row derived from the column keys by default', () => {
    expect(stringify([{ name: 'Alex', age: 29 }])).toBe('name,age\r\nAlex,29');
  });

  it('emits nothing (no empty header row) for an empty dataset', () => {
    expect(stringify([])).toBe('');
  });

  it('keeps columns aligned across reordered, missing and extra keys', () => {
    const csv = stringify([{ a: 1, b: 2 }, { b: 3, a: 4 }, { a: 5 }]);
    expect(csv).toBe('a,b\r\n1,2\r\n4,3\r\n5,');
  });

  it('selects and orders columns from an array', () => {
    const csv = stringify([{ a: 1, b: 2, c: 3 }], { columns: ['c', 'a'] });
    expect(csv).toBe('c,a\r\n3,1');
  });

  it('selects, orders and labels columns from a map', () => {
    const csv = stringify([{ name: 'Alex', age: 29 }], {
      columns: { age: 'Age', name: 'Full name' }
    });
    expect(csv).toBe('Age,Full name\r\n29,Alex');
  });

  it('omits the header row when showHeaders is false', () => {
    expect(stringify([{ a: 1 }], { showHeaders: false })).toBe('1');
  });

  it('prepends a BOM when requested', () => {
    expect(stringify([{ a: 1 }], { bom: true })).toBe('﻿a\r\n1');
  });

  it('round-trips through a standard CSV parser', () => {
    const data = [{ name: 'Alex, Jr.', quote: 'say "hi"', n: 29 }];
    const parsed = Papa.parse<Record<string, string>>(stringify(data), {
      header: true
    }).data;
    expect(parsed).toEqual([{ name: 'Alex, Jr.', quote: 'say "hi"', n: '29' }]);
  });
});

describe('stringify with unsupported cell values', () => {
  const as = (records: unknown[]): CsvRecord[] => records as CsvRecord[];

  it('throws a located CsvPipeError for an object cell', () => {
    const data = as([{ name: 'ok' }, { name: {} }]);
    expect(() => stringify(data)).toThrow(CsvPipeError);
    expect(() => stringify(data)).toThrow('row 1, column "name"');
  });

  it('names a function value', () => {
    const data = as([{ run: () => 1 }]);
    expect(() => stringify(data)).toThrow('Cannot encode a function');
  });

  it('names a symbol value', () => {
    const data = as([{ id: Symbol('x') }]);
    expect(() => stringify(data)).toThrow('Cannot encode a symbol');
  });

  it('reports the offending item inside an array cell', () => {
    const data = as([{ tags: [1, () => 2] }]);
    expect(() => stringify(data)).toThrow(
      'Cannot encode a function at row 0, column "tags"'
    );
  });
});

describe('stringify formatting options', () => {
  it('renders a Date as an ISO string by default', () => {
    const at = new Date('2026-06-04T10:00:00.000Z');
    expect(stringify([{ at }])).toBe('at\r\n2026-06-04T10:00:00.000Z');
  });

  it('applies the format hook to each value', () => {
    const csv = stringify([{ price: 1234.5 }], {
      format: (value) => (typeof value === 'number' ? value.toFixed(2) : value)
    });
    expect(csv).toBe('price\r\n1234.50');
  });

  it('passes the column and row index to the format hook', () => {
    const seen: string[] = [];
    stringify([{ a: 1 }, { a: 2 }], {
      format: (value, context) => {
        seen.push(`${context.column}:${context.rowIndex}`);
        return value;
      }
    });
    expect(seen).toEqual(['a:0', 'a:1']);
  });

  it('lets the format hook serialize values that would otherwise throw', () => {
    const csv = stringify([{ tags: { primary: true } }], {
      format: (value) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? JSON.stringify(value)
          : value
    });
    expect(csv).toBe('tags\r\n"{""primary"":true}"');
  });

  it('appends a trailing newline when finalNewline is set', () => {
    expect(stringify([{ a: 1 }], { finalNewline: true })).toBe('a\r\n1\r\n');
  });

  it('adds no trailing newline for an empty dataset', () => {
    expect(stringify([], { finalNewline: true })).toBe('');
  });

  it('quotes everything except numbers with quoting "non-numeric"', () => {
    const csv = stringify([{ name: 'Alex', age: 29 }], {
      columns: ['name', 'age'],
      quoting: 'non-numeric',
      showHeaders: false
    });
    expect(csv).toBe('"Alex",29');
  });
});
