import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from './parse';

// Third-party provenance: run the external csv-spectrum fixture suite, asserting
// parse matches each fixture's expected JSON.
const spectrumDirectory = dirname(
  createRequire(import.meta.url).resolve('csv-spectrum')
);
const csvDirectory = join(spectrumDirectory, 'csvs');

// csv-spectrum ships this fixture malformed: its JSON is a bare object with placeholder data, not the parsed rows, so it cannot be asserted.
const malformedFixtures = new Set(['location_coordinates']);

describe('csv-spectrum external suite', () => {
  for (const fileName of readdirSync(csvDirectory)) {
    const caseName = basename(fileName, extname(fileName));
    if (malformedFixtures.has(caseName)) continue;
    it(caseName, () => {
      const csv = readFileSync(join(csvDirectory, fileName), 'utf8');
      const expected = JSON.parse(
        readFileSync(
          join(spectrumDirectory, 'json', `${caseName}.json`),
          'utf8'
        )
      );
      expect(parse(csv)).toEqual(expected);
    });
  }
});
