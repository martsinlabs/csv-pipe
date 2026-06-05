import type { ResolvedCsvOptions } from './options';

/**
 * Built-in defaults. Chosen to be RFC 4180-correct and CSV-idiomatic: empty
 * strings for absent or non-finite values, comma plus CRLF framing, and minimal
 * quoting so clean values stay unquoted.
 */
export const DEFAULT_OPTIONS: Omit<
  ResolvedCsvOptions,
  'quoteTest' | 'quoteEscaped' | 'quoteEscapeRegex'
> = {
  showHeaders: true,
  separator: ',',
  quote: '"',
  newline: '\r\n',
  finalNewline: false,
  quoting: 'minimal',
  format: undefined,
  nullText: '',
  undefinedText: '',
  nanText: '',
  infinityText: 'Infinity',
  booleans: { true: 'true', false: 'false' },
  arraySeparator: ', ',
  bom: false,
  sanitizeFormulas: false,
  formulaPrefix: "'"
};
