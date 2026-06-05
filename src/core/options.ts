import type {
  BooleanStyle,
  CsvFormatOptions,
  CsvFormatter,
  QuotingMode
} from '../types';
import { DEFAULT_OPTIONS } from './constants';

/**
 * Fully-resolved formatting options. Built once per encoder, including a
 * precompiled {@link ResolvedCsvOptions.quoteTest}, so the hot path does no
 * per-call option work.
 */
export interface ResolvedCsvOptions {
  readonly showHeaders: boolean;
  readonly separator: string;
  readonly quote: string;
  readonly newline: string;
  readonly finalNewline: boolean;
  readonly quoting: QuotingMode;
  readonly format: CsvFormatter | undefined;
  readonly nullText: string;
  readonly undefinedText: string;
  readonly nanText: string;
  readonly infinityText: string;
  readonly booleans: BooleanStyle;
  readonly arraySeparator: string;
  readonly bom: boolean;
  readonly sanitizeFormulas: boolean;
  readonly formulaPrefix: string;
  /** Matches a field that must be quoted: contains the quote, separator, CR or LF. */
  readonly quoteTest: RegExp;
  /** The quote character doubled, used as the escape replacement. */
  readonly quoteEscaped: string;
  /** Global match of the quote character, used to escape it. */
  readonly quoteEscapeRegex: RegExp;
}

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeForCharClass(char: string): string {
  return char.replace(/[\]\\^-]/g, '\\$&');
}

/**
 * Match a field that must be quoted (contains the quote, separator, CR or LF).
 * Single-character quote and separator (the common case) compile to a character
 * class, which V8 runs far faster than the alternation needed for multi-char
 * delimiters.
 */
function buildQuoteTest(quote: string, separator: string): RegExp {
  if (quote.length === 1 && separator.length === 1) {
    return new RegExp(
      `[${escapeForCharClass(quote)}${escapeForCharClass(separator)}\\r\\n]`
    );
  }
  return new RegExp(
    `${escapeForRegExp(quote)}|${escapeForRegExp(separator)}|\\r|\\n`
  );
}

/** Merge user options over the defaults into a fully-resolved option set. */
export function resolveOptions(
  options: CsvFormatOptions = {}
): ResolvedCsvOptions {
  const separator = options.separator ?? DEFAULT_OPTIONS.separator;
  const quote = options.quote ?? DEFAULT_OPTIONS.quote;

  return {
    showHeaders: options.showHeaders ?? DEFAULT_OPTIONS.showHeaders,
    separator,
    quote,
    newline: options.newline ?? DEFAULT_OPTIONS.newline,
    finalNewline: options.finalNewline ?? DEFAULT_OPTIONS.finalNewline,
    quoting: options.quoting ?? DEFAULT_OPTIONS.quoting,
    format: options.format ?? DEFAULT_OPTIONS.format,
    nullText: options.nullText ?? DEFAULT_OPTIONS.nullText,
    undefinedText: options.undefinedText ?? DEFAULT_OPTIONS.undefinedText,
    nanText: options.nanText ?? DEFAULT_OPTIONS.nanText,
    infinityText: options.infinityText ?? DEFAULT_OPTIONS.infinityText,
    arraySeparator: options.arraySeparator ?? DEFAULT_OPTIONS.arraySeparator,
    booleans: { ...DEFAULT_OPTIONS.booleans, ...options.booleans },
    bom: options.bom ?? DEFAULT_OPTIONS.bom,
    sanitizeFormulas:
      options.sanitizeFormulas ?? DEFAULT_OPTIONS.sanitizeFormulas,
    formulaPrefix: options.formulaPrefix ?? DEFAULT_OPTIONS.formulaPrefix,
    quoteTest: buildQuoteTest(quote, separator),
    quoteEscaped: quote + quote,
    quoteEscapeRegex: new RegExp(escapeForRegExp(quote), 'g')
  };
}
