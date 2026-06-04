import fc from 'fast-check';
import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { stringify } from './stringify';

// Cells drawn from characters that exercise the quoting and escaping paths:
// the separator, the quote, CR, LF, tab, and a couple of plain characters.
const cell = fc.string({
  unit: fc.constantFrom('a', '0', ' ', ',', '"', '\n', '\r', '\t', ';'),
  maxLength: 12
});

// A fixed key set keeps the columns stable, so a round-trip is well defined.
const record = fc.record({ a: cell, b: cell, c: cell });
const dataset = fc.array(record, { minLength: 1, maxLength: 25 });

describe('stringify round-trip', () => {
  it('survives a standard parser for arbitrary string data', () => {
    fc.assert(
      fc.property(dataset, (records) => {
        const parsed = Papa.parse<Record<string, string>>(stringify(records), {
          header: true,
          delimiter: ',',
          newline: '\r\n'
        }).data;
        expect(parsed).toEqual(records);
      }),
      { numRuns: 1000 }
    );
  });
});
