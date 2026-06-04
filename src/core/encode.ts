import { UnsupportedValueError } from '../errors';
import type { CsvCell, CsvPrimitive } from '../types';
import type { ResolvedCsvOptions } from './options';

const CR = '\r';
const LF = '\n';

/** Render a single scalar to its string form per the resolved options. */
function coercePrimitive(
  value: CsvPrimitive,
  options: ResolvedCsvOptions
): string {
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
      throw new UnsupportedValueError(value);
  }
}

/** Render a cell (scalar or array) to its unquoted string form. */
export function coerce(value: CsvCell, options: ResolvedCsvOptions): string {
  if (Array.isArray(value)) {
    return value
      .map((item: CsvPrimitive) => coercePrimitive(item, options))
      .join(options.arraySeparator);
  }
  return coercePrimitive(value as CsvPrimitive, options);
}

/** Whether a rendered field must be wrapped in quotes. */
export function needsQuoting(
  text: string,
  options: ResolvedCsvOptions
): boolean {
  if (options.quoting === 'all') return true;
  return (
    text.includes(options.quote) ||
    text.includes(options.separator) ||
    text.includes(CR) ||
    text.includes(LF)
  );
}

/**
 * Encode one cell into a CSV field, quoting and escaping per RFC 4180: when
 * quoted, every embedded quote character is doubled.
 */
export function encodeField(
  value: CsvCell,
  options: ResolvedCsvOptions
): string {
  const text = coerce(value, options);
  if (!needsQuoting(text, options)) return text;
  const escaped = text.split(options.quote).join(options.quote + options.quote);
  return `${options.quote}${escaped}${options.quote}`;
}
