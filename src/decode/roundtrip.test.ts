import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { stringify } from '../encode/stringify';
import { parse } from './parse';

describe('encode/parse round-trip', () => {
  it('recovers string records through stringify then parse', () => {
    const record = fc.record({ a: fc.string(), b: fc.string() });
    fc.assert(
      fc.property(fc.array(record, { minLength: 1 }), (records) => {
        const recovered = parse(stringify(records), {
          skipEmptyLines: false
        });
        expect(recovered).toEqual(records);
      })
    );
  });

  it('round-trips with a custom separator and quote', () => {
    const record = fc.record({ a: fc.string(), b: fc.string() });
    fc.assert(
      fc.property(fc.array(record, { minLength: 1 }), (records) => {
        const csv = stringify(records, { separator: ';', quote: "'" });
        const recovered = parse(csv, {
          separator: ';',
          quote: "'",
          skipEmptyLines: false
        });
        expect(recovered).toEqual(records);
      })
    );
  });

  it('round-trips fields full of delimiters, quotes, and newlines', () => {
    const nasty = fc.stringMatching(/^[a-z,"\r\n]*$/);
    const record = fc.record({ a: nasty, b: nasty });
    fc.assert(
      fc.property(fc.array(record, { minLength: 1 }), (records) => {
        const recovered = parse(stringify(records), {
          skipEmptyLines: false
        });
        expect(recovered).toEqual(records);
      })
    );
  });
});
