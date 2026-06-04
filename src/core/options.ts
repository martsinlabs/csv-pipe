import type { BooleanStyle, CsvFormatOptions, QuotingMode } from '../types';
import { DEFAULT_OPTIONS } from './constants';

/**
 * Fully-resolved formatting options: the same fields as {@link CsvFormatOptions}
 * but with every value present. This is the only options shape the core encoder
 * sees, which keeps the encoding path free of "is this set?" checks.
 */
export interface ResolvedCsvOptions {
  readonly showHeaders: boolean;
  readonly separator: string;
  readonly quote: string;
  readonly newline: string;
  readonly quoting: QuotingMode;
  readonly nullText: string;
  readonly undefinedText: string;
  readonly nanText: string;
  readonly infinityText: string;
  readonly booleans: BooleanStyle;
  readonly arraySeparator: string;
  readonly bom: boolean;
}

/** Merge user options over the defaults into a fully-resolved option set. */
export function resolveOptions(
  options: CsvFormatOptions = {}
): ResolvedCsvOptions {
  return {
    showHeaders: options.showHeaders ?? DEFAULT_OPTIONS.showHeaders,
    separator: options.separator ?? DEFAULT_OPTIONS.separator,
    quote: options.quote ?? DEFAULT_OPTIONS.quote,
    newline: options.newline ?? DEFAULT_OPTIONS.newline,
    quoting: options.quoting ?? DEFAULT_OPTIONS.quoting,
    nullText: options.nullText ?? DEFAULT_OPTIONS.nullText,
    undefinedText: options.undefinedText ?? DEFAULT_OPTIONS.undefinedText,
    nanText: options.nanText ?? DEFAULT_OPTIONS.nanText,
    infinityText: options.infinityText ?? DEFAULT_OPTIONS.infinityText,
    arraySeparator: options.arraySeparator ?? DEFAULT_OPTIONS.arraySeparator,
    booleans: { ...DEFAULT_OPTIONS.booleans, ...options.booleans },
    bom: options.bom ?? DEFAULT_OPTIONS.bom
  };
}
