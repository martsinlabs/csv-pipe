import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parse } from './parse';

// parse must be total: for ANY input string it returns well-formed records and
// never throws, so an unenumerated edge case cannot crash it or corrupt shape.
describe('parse totality over arbitrary input', () => {
  it('returns string-only rows for any input with header:false', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const rows = parse(input, { header: false });
        expect(Array.isArray(rows)).toBe(true);
        for (const row of rows) {
          expect(Array.isArray(row)).toBe(true);
          for (const field of row) expect(typeof field).toBe('string');
        }
      }),
      { numRuns: 1000 }
    );
  });

  it('returns plain object records for any input with a header', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const records = parse(input);
        expect(Array.isArray(records)).toBe(true);
        for (const record of records) {
          expect(record).toBeTypeOf('object');
          expect(record).not.toBeNull();
        }
      }),
      { numRuns: 1000 }
    );
  });

  it('coerces only to string, number, or boolean under dynamicTyping', () => {
    const allowedTypes = new Set(['string', 'number', 'boolean']);
    fc.assert(
      fc.property(fc.string(), (input) => {
        for (const record of parse(input, { dynamicTyping: true })) {
          for (const value of Object.values(record)) {
            expect(allowedTypes.has(typeof value)).toBe(true);
          }
        }
      }),
      { numRuns: 1000 }
    );
  });
});
