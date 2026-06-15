import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenize';

const COMMA = 44;
const QUOTE = 34;

const run = (input: string) => tokenize(input, COMMA, QUOTE);

describe('tokenize', () => {
  it('returns no rows for empty input', () => {
    expect(run('')).toEqual([]);
  });

  it('splits simple fields and rows', () => {
    expect(run('a')).toEqual([['a']]);
    expect(run('a,b')).toEqual([['a', 'b']]);
    expect(run('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });

  it('keeps empty fields and a trailing empty field', () => {
    expect(run('a,,b')).toEqual([['a', '', 'b']]);
    expect(run('a,')).toEqual([['a', '']]);
  });

  it('handles LF, CR, and CRLF line endings', () => {
    expect(run('a\r\nb')).toEqual([['a'], ['b']]);
    expect(run('a\rb')).toEqual([['a'], ['b']]);
    expect(run('a\nb')).toEqual([['a'], ['b']]);
  });

  it('drops no data for a single trailing newline', () => {
    expect(run('a\n')).toEqual([['a']]);
    expect(run('a,b\r\n')).toEqual([['a', 'b']]);
  });

  it('keeps a blank line as a single empty field', () => {
    expect(run('a\n\nb')).toEqual([['a'], [''], ['b']]);
  });

  it('reads quoted fields containing the separator and newlines', () => {
    expect(run('"a,b"')).toEqual([['a,b']]);
    expect(run('"a\nb"')).toEqual([['a\nb']]);
    expect(run('"a,b",c')).toEqual([['a,b', 'c']]);
  });

  it('unescapes doubled quotes', () => {
    expect(run('"a""b"')).toEqual([['a"b']]);
    expect(run('""')).toEqual([['']]);
    expect(run('"""a"""')).toEqual([['"a"']]);
  });

  it('takes an unterminated quoted field to end of input', () => {
    expect(run('"ab')).toEqual([['ab']]);
    expect(run('a,"bc')).toEqual([['a', 'bc']]);
  });

  it('ignores stray characters after a closing quote', () => {
    expect(run('"a"junk,b')).toEqual([['a', 'b']]);
    expect(run('"a"junk\nb')).toEqual([['a'], ['b']]);
  });
});
