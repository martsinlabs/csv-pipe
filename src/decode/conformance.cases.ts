import type { CsvParseOptions } from '../types';

// One CSV edge case: input, parse options, and the exact records parse must return.
export interface ConformanceCase {
  readonly name: string;
  readonly input: string;
  readonly options: CsvParseOptions;
  readonly expected: readonly unknown[];
}

// Curated CSV edge cases (RFC 4180 and known quirk lists), all asserted in CI; structural cases use header:false so expected is the raw rows.
export const conformanceCases: readonly ConformanceCase[] = [
  // Structure: separators, rows, and empty fields.
  {
    name: 'single field',
    input: 'a',
    options: { header: false },
    expected: [['a']]
  },
  {
    name: 'fields on one row',
    input: 'a,b,c',
    options: { header: false },
    expected: [['a', 'b', 'c']]
  },
  {
    name: 'two rows',
    input: 'a,b\nc,d',
    options: { header: false },
    expected: [
      ['a', 'b'],
      ['c', 'd']
    ]
  },
  { name: 'empty input', input: '', options: { header: false }, expected: [] },
  {
    name: 'empty field between values',
    input: 'a,,c',
    options: { header: false },
    expected: [['a', '', 'c']]
  },
  {
    name: 'trailing empty field',
    input: 'a,',
    options: { header: false },
    expected: [['a', '']]
  },
  {
    name: 'leading empty field',
    input: ',a',
    options: { header: false },
    expected: [['', 'a']]
  },
  {
    name: 'a row of only empty fields',
    input: ',,',
    options: { header: false },
    expected: [['', '', '']]
  },

  // Line endings: LF, CRLF, lone CR, and trailing breaks.
  {
    name: 'LF line ending',
    input: 'a\nb',
    options: { header: false },
    expected: [['a'], ['b']]
  },
  {
    name: 'CRLF line ending',
    input: 'a\r\nb',
    options: { header: false },
    expected: [['a'], ['b']]
  },
  {
    name: 'lone CR line ending',
    input: 'a\rb',
    options: { header: false },
    expected: [['a'], ['b']]
  },
  {
    name: 'trailing LF adds no row',
    input: 'a\n',
    options: { header: false },
    expected: [['a']]
  },
  {
    name: 'trailing CRLF adds no row',
    input: 'a,b\r\n',
    options: { header: false },
    expected: [['a', 'b']]
  },
  {
    name: 'trailing lone CR adds no row',
    input: 'a\r',
    options: { header: false },
    expected: [['a']]
  },

  // RFC 4180 quoting and escaping.
  {
    name: 'quoted field',
    input: '"a"',
    options: { header: false },
    expected: [['a']]
  },
  {
    name: 'quoted separator',
    input: '"a,b",c',
    options: { header: false },
    expected: [['a,b', 'c']]
  },
  {
    name: 'quoted LF inside a field',
    input: '"a\nb"',
    options: { header: false },
    expected: [['a\nb']]
  },
  {
    name: 'quoted CRLF inside a field',
    input: '"a\r\nb"',
    options: { header: false },
    expected: [['a\r\nb']]
  },
  {
    name: 'doubled quote becomes one',
    input: '"a""b"',
    options: { header: false },
    expected: [['a"b']]
  },
  {
    name: 'empty quoted field when empty lines are kept',
    input: '""',
    options: { header: false, skipEmptyLines: false },
    expected: [['']]
  },
  {
    name: 'quotes wrapping a quoted phrase',
    input: '"He said ""hi"""',
    options: { header: false },
    expected: [['He said "hi"']]
  },

  // Lenient handling of malformed input.
  {
    name: 'quote inside an unquoted field is literal',
    input: 'a"b',
    options: { header: false },
    expected: [['a"b']]
  },
  {
    name: 'characters after a closing quote are ignored',
    input: '"a"junk,b',
    options: { header: false },
    expected: [['a', 'b']]
  },
  {
    name: 'unterminated quote reads to end',
    input: '"ab',
    options: { header: false },
    expected: [['ab']]
  },
  {
    name: 'ragged short row kept as is',
    input: 'a,b\nc',
    options: { header: false },
    expected: [['a', 'b'], ['c']]
  },
  {
    name: 'ragged long row kept as is',
    input: 'a\nb,c',
    options: { header: false },
    expected: [['a'], ['b', 'c']]
  },

  // Whitespace is preserved unless trimmed.
  {
    name: 'surrounding spaces are preserved',
    input: ' a , b ',
    options: { header: false },
    expected: [[' a ', ' b ']]
  },
  {
    name: 'spaces inside quotes are preserved',
    input: '" a "',
    options: { header: false },
    expected: [[' a ']]
  },
  {
    name: 'a whitespace-only field is kept',
    input: ' ',
    options: { header: false },
    expected: [[' ']]
  },

  // Empty lines.
  {
    name: 'blank line is skipped by default',
    input: 'a\n\nb',
    options: { header: false },
    expected: [['a'], ['b']]
  },
  {
    name: 'blank CRLF line is skipped',
    input: 'a\r\n\r\nb',
    options: { header: false },
    expected: [['a'], ['b']]
  },
  {
    name: 'only blank lines yield no rows',
    input: '\n\n',
    options: { header: false },
    expected: []
  },
  {
    name: 'greedy skip drops a whitespace-only line',
    input: 'a\n   \nb',
    options: { header: false, skipEmptyLines: 'greedy' },
    expected: [['a'], ['b']]
  },

  // Unicode and byte-order mark.
  {
    name: 'accented and CJK characters',
    input: 'café,日本',
    options: { header: false },
    expected: [['café', '日本']]
  },
  {
    name: 'emoji including a surrogate pair',
    input: 'a,😀',
    options: { header: false },
    expected: [['a', '😀']]
  },
  {
    name: 'leading byte-order mark is stripped',
    input: '﻿a,b',
    options: { header: false },
    expected: [['a', 'b']]
  },

  // Headers and records.
  {
    name: 'header row supplies the keys',
    input: 'name,age\nAda,36',
    options: {},
    expected: [{ name: 'Ada', age: '36' }]
  },
  {
    name: 'short row pads missing fields',
    input: 'a,b\n1',
    options: {},
    expected: [{ a: '1', b: '' }]
  },
  {
    name: 'long row drops extra fields',
    input: 'a,b\n1,2,3',
    options: {},
    expected: [{ a: '1', b: '2' }]
  },
  {
    name: 'duplicate header keeps the last column',
    input: 'a,a\n1,2',
    options: {},
    expected: [{ a: '2' }]
  },

  // Dynamic typing, lossless only.
  {
    name: 'integer is coerced',
    input: 'n\n42',
    options: { dynamicTyping: true },
    expected: [{ n: 42 }]
  },
  {
    name: 'boolean is coerced',
    input: 'b\ntrue',
    options: { dynamicTyping: true },
    expected: [{ b: true }]
  },
  {
    name: 'leading zero stays a string',
    input: 'n\n007',
    options: { dynamicTyping: true },
    expected: [{ n: '007' }]
  },
  {
    name: 'trailing zero stays a string',
    input: 'n\n1.50',
    options: { dynamicTyping: true },
    expected: [{ n: '1.50' }]
  },
  {
    name: 'non-finite stays a string',
    input: 'n\nInfinity',
    options: { dynamicTyping: true },
    expected: [{ n: 'Infinity' }]
  },

  // Separators, detection, comments, and trimming.
  {
    name: 'semicolon separator',
    input: 'a;b\n1;2',
    options: { header: false, separator: ';' },
    expected: [
      ['a', 'b'],
      ['1', '2']
    ]
  },
  {
    name: 'tab separator',
    input: 'a\tb',
    options: { header: false, separator: '\t' },
    expected: [['a', 'b']]
  },
  {
    name: 'separator auto-detection',
    input: 'a;b\n1;2',
    options: { separator: 'auto' },
    expected: [{ a: '1', b: '2' }]
  },
  {
    name: 'comment line is skipped',
    input: 'a\n1\n# note\n2',
    options: { header: false, comment: '#' },
    expected: [['a'], ['1'], ['2']]
  },
  {
    name: 'trim removes surrounding whitespace',
    input: ' a , b \n 1 , 2 ',
    options: { header: false, trim: true },
    expected: [
      ['a', 'b'],
      ['1', '2']
    ]
  },

  // More quoting and escaping corners.
  {
    name: 'doubled quote at field end',
    input: '"a"""',
    options: { header: false },
    expected: [['a"']]
  },
  {
    name: 'a space before a quote is literal',
    input: 'a, "b"',
    options: { header: false },
    expected: [['a', ' "b"']]
  },
  {
    name: 'custom quote character',
    input: "'a,b',c",
    options: { header: false, quote: "'" },
    expected: [['a,b', 'c']]
  },
  {
    name: 'a quoted field of only a newline',
    input: '"\n"',
    options: { header: false },
    expected: [['\n']]
  },
  {
    name: 'empty quoted field inside a row',
    input: 'a,"",c',
    options: { header: false },
    expected: [['a', '', 'c']]
  },

  // More line endings and byte-order marks.
  {
    name: 'mixed CRLF and LF endings',
    input: 'a\r\nb\nc',
    options: { header: false },
    expected: [['a'], ['b'], ['c']]
  },
  {
    name: 'byte-order mark before a quoted field',
    input: '﻿"a",b',
    options: { header: false },
    expected: [['a', 'b']]
  },
  {
    name: 'input of only a byte-order mark',
    input: '﻿',
    options: { header: false },
    expected: []
  },

  // More separators, detection, and comments.
  {
    name: 'pipe separator',
    input: 'a|b\n1|2',
    options: { header: false, separator: '|' },
    expected: [
      ['a', 'b'],
      ['1', '2']
    ]
  },
  {
    name: 'auto-detect a tab separator',
    input: 'a\tb\n1\t2',
    options: { separator: 'auto' },
    expected: [{ a: '1', b: '2' }]
  },
  {
    name: 'a comment character mid-field is literal',
    input: 'a#b\nx',
    options: { header: false, comment: '#' },
    expected: [['a#b'], ['x']]
  },
  {
    name: 'a quoted first field starting with the comment is skipped',
    input: '"#x",y\n1,2',
    options: { header: false, comment: '#' },
    expected: [['1', '2']]
  },

  // More dynamic typing, lossless only.
  {
    name: 'negative integer is coerced',
    input: 'n\n-5',
    options: { dynamicTyping: true },
    expected: [{ n: -5 }]
  },
  {
    name: 'zero is coerced',
    input: 'n\n0',
    options: { dynamicTyping: true },
    expected: [{ n: 0 }]
  },
  {
    name: 'a leading plus stays a string',
    input: 'n\n+1',
    options: { dynamicTyping: true },
    expected: [{ n: '+1' }]
  },
  {
    name: 'scientific notation stays a string',
    input: 'n\n1e3',
    options: { dynamicTyping: true },
    expected: [{ n: '1e3' }]
  },
  {
    name: 'an unsafe-large integer stays a string',
    input: 'n\n9007199254740993',
    options: { dynamicTyping: true },
    expected: [{ n: '9007199254740993' }]
  },
  {
    name: 'negative zero stays a string',
    input: 'n\n-0',
    options: { dynamicTyping: true },
    expected: [{ n: '-0' }]
  },
  {
    name: 'an empty field stays an empty string',
    input: 'a,n\nx,',
    options: { dynamicTyping: true },
    expected: [{ a: 'x', n: '' }]
  },

  // More columns, headers, and limits.
  {
    name: 'positional columns name headerless rows',
    input: '1,2\n3,4',
    options: { header: false, columns: ['x', 'y'] },
    expected: [
      { x: '1', y: '2' },
      { x: '3', y: '4' }
    ]
  },
  {
    name: 'a label map renames columns',
    input: 'Full Name,Email\nAda,a@b',
    options: { columns: { 'Full Name': 'name', Email: 'email' } },
    expected: [{ name: 'Ada', email: 'a@b' }]
  },
  {
    name: 'a header with no data rows',
    input: 'name,age',
    options: {},
    expected: []
  },
  {
    name: 'maxRows stops early',
    input: 'a\n1\n2\n3',
    options: { maxRows: 1 },
    expected: [{ a: '1' }]
  }
];
