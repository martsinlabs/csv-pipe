import { UnsupportedValueError } from '../errors';
import type { ResolvedCsvOptions } from './options';

/**
 * Leading characters a spreadsheet may interpret as the start of a formula.
 * Mirrors the OWASP CSV-injection guidance: `=`, `+`, `-`, `@`, tab, and CR.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/** Render a single scalar to its string form per the resolved options. */
function coercePrimitive(value: unknown, options: ResolvedCsvOptions): string {
  if (value === null) return options.nullText;
  if (value === undefined) return options.undefinedText;

  switch (typeof value) {
    case 'string':
      return value;
    case 'boolean':
      return value ? options.booleans.true : options.booleans.false;
    case 'bigint':
      return value.toString();
    case 'number':
      if (Number.isNaN(value)) return options.nanText;
      if (value === Infinity) return options.infinityText;
      if (value === -Infinity) return `-${options.infinityText}`;
      return String(value);
    default:
      if (value instanceof Date) return value.toISOString();
      throw new UnsupportedValueError(value);
  }
}

/** Render a cell (scalar or array) to its unquoted string form. */
function coerce(value: unknown, options: ResolvedCsvOptions): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => coercePrimitive(item, options))
      .join(options.arraySeparator);
  }
  return coercePrimitive(value, options);
}

/** Whether a value must be quoted under the configured strategy. */
function mustQuote(
  value: unknown,
  text: string,
  options: ResolvedCsvOptions
): boolean {
  if (options.quoting === 'minimal') return options.quoteTest.test(text);
  if (options.quoting === 'all') return true;
  // non-numeric: quote everything except numbers and bigints.
  return typeof value !== 'number' && typeof value !== 'bigint';
}

/**
 * Encode one cell into a CSV field, quoting and escaping per RFC 4180: when
 * quoted, every embedded quote character is doubled.
 */
export function encodeField(
  value: unknown,
  options: ResolvedCsvOptions
): string {
  // Fast path for the most common cell type, skipping the coerce indirection.
  let text = typeof value === 'string' ? value : coerce(value, options);
  // Guard string and array cells against spreadsheet formula injection. Numbers,
  // booleans, and dates are producer-generated, so they are left untouched.
  if (
    options.sanitizeFormulas &&
    (typeof value === 'string' || Array.isArray(value)) &&
    FORMULA_LEAD.test(text)
  ) {
    text = options.formulaPrefix + text;
  }
  if (!mustQuote(value, text, options)) return text;
  // indexOf is cheaper than running the escape regex on fields with no quote.
  const escaped =
    text.indexOf(options.quote) === -1
      ? text
      : text.replace(options.quoteEscapeRegex, options.quoteEscaped);
  return `${options.quote}${escaped}${options.quote}`;
}
