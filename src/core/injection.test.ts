import { describe, expect, it } from 'vitest';
import { encodeField } from './encode';
import { resolveOptions } from './options';

const guarded = resolveOptions({ sanitizeFormulas: true });

describe('formula-injection guard', () => {
  it('is off by default', () => {
    const plain = resolveOptions();
    expect(encodeField('=1+1', plain)).toBe('=1+1');
  });

  it('prefixes string cells that lead with a formula character', () => {
    expect(encodeField('=1+1', guarded)).toBe("'=1+1");
    expect(encodeField('+1', guarded)).toBe("'+1");
    expect(encodeField('-1+1', guarded)).toBe("'-1+1");
    expect(encodeField('@SUM(A1)', guarded)).toBe("'@SUM(A1)");
    expect(encodeField('\tx', guarded)).toBe("'\tx");
    // A leading CR triggers quoting, so the guarded value is also quoted.
    expect(encodeField('\rx', guarded)).toBe('"\'\rx"');
  });

  it('leaves safe string cells untouched', () => {
    expect(encodeField('hello', guarded)).toBe('hello');
    expect(encodeField('a=b', guarded)).toBe('a=b');
    expect(encodeField('', guarded)).toBe('');
  });

  it('never alters numbers, booleans, or dates', () => {
    expect(encodeField(-5, guarded)).toBe('-5');
    expect(encodeField(-1.5, guarded)).toBe('-1.5');
    expect(encodeField(true, guarded)).toBe('true');
    expect(encodeField(new Date('2026-06-04T00:00:00.000Z'), guarded)).toBe(
      '2026-06-04T00:00:00.000Z'
    );
  });

  it('guards an array cell that leads with a formula character', () => {
    expect(encodeField(['=cmd', 'x'], guarded)).toBe('"\'=cmd, x"');
  });

  it('honors a custom prefix', () => {
    const tab = resolveOptions({ sanitizeFormulas: true, formulaPrefix: '\t' });
    expect(encodeField('=1+1', tab)).toBe('\t=1+1');
  });

  it('still quotes when the guarded value needs quoting', () => {
    expect(encodeField('=1,2', guarded)).toBe('"\'=1,2"');
  });
});
