import { describe, expect, it } from 'vitest';
import { conformanceCases } from './conformance.cases';
import { parse } from './parse';

// Runs the curated CSV edge-case corpus through parse, asserting every case.
describe('conformance corpus', () => {
  for (const conformanceCase of conformanceCases) {
    it(conformanceCase.name, () => {
      const records = parse(conformanceCase.input, conformanceCase.options);
      expect(records).toEqual(conformanceCase.expected);
    });
  }
});
