/** A single scalar that can appear in a CSV cell. */
export type CsvPrimitive =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined;

/** A cell value: a scalar, or an array of scalars joined within one field. */
export type CsvCell = CsvPrimitive | readonly CsvPrimitive[];

/** One record (row) keyed by column name. */
export type CsvRecord = Record<string, CsvCell>;

/** A list of records, the usual input to the encoder. */
export type CsvInput = readonly CsvRecord[];

/**
 * When to wrap a field in quotes.
 * - `minimal`: only when the value contains the separator, a quote, CR or LF (RFC 4180).
 * - `all`: always quote every field.
 * - `non-numeric`: quote every field except numbers and bigints.
 */
export type QuotingMode = 'minimal' | 'all' | 'non-numeric';

/** How boolean values are rendered. */
export interface BooleanStyle {
  readonly true: string;
  readonly false: string;
}

/** Where a value sits in the dataset, passed to a {@link CsvFormatter}. */
export interface CsvFormatContext {
  /** The column key being encoded. */
  readonly column: string;
  /** The record's zero-based position in the input. */
  readonly rowIndex: number;
}

/**
 * Convert a raw value into something encodable before it becomes a cell. Use it
 * to render dates, format numbers, or serialize objects. The returned value is
 * coerced and quoted like any cell, so return a string, number, boolean, bigint,
 * null, undefined, or an array of those (return the value unchanged to pass it
 * through).
 */
export type CsvFormatter = (
  value: unknown,
  context: CsvFormatContext
) => unknown;

/**
 * Column selection for a record type `T`.
 *
 * - An array of keys selects and orders columns; each key is also its header.
 * - A map of key to label selects and orders columns (by insertion order) and
 *   sets the header label for each.
 *
 * Keys are constrained to `keyof T`, so a typo is a compile error.
 */
export type CsvColumns<T> =
  | readonly (keyof T & string)[]
  | Partial<Record<keyof T & string, string>>;

/** Formatting options, independent of the record shape. */
export interface CsvFormatOptions {
  /** Whether to emit a header row. Default `true`. */
  showHeaders?: boolean;
  /** Field separator. Default `,`. */
  separator?: string;
  /** Quote character used when a field must be quoted. Default `"`. */
  quote?: string;
  /** Line terminator between records. Default `\r\n` (RFC 4180). */
  newline?: string;
  /** Append a trailing newline after the last record. Default `false`. */
  finalNewline?: boolean;
  /** Quoting strategy. Default `minimal`. */
  quoting?: QuotingMode;
  /** Transform each raw value into a cell before it is encoded. */
  format?: CsvFormatter;
  /** Text for `null` values. Default `""`. */
  nullText?: string;
  /** Text for `undefined` values. Default `""`. */
  undefinedText?: string;
  /** Text for `NaN` values. Default `""`. */
  nanText?: string;
  /** Text for `Infinity`. `-Infinity` is rendered as `-` followed by this. Default `Infinity`. */
  infinityText?: string;
  /** Rendering of boolean values. Default `{ true: "true", false: "false" }`. */
  booleans?: BooleanStyle;
  /** Separator used to join an array within a single cell. Default `", "`. */
  arraySeparator?: string;
  /** Prepend a UTF-8 byte-order mark. Default `false`. */
  bom?: boolean;
  /**
   * Guard against CSV formula injection. When a string or array cell would
   * begin with a character a spreadsheet may treat as a formula (`=`, `+`, `-`,
   * `@`, a tab, or a carriage return), prefix it with {@link formulaPrefix} so
   * the value is shown literally. Numbers, booleans, and dates are never
   * altered. Default `false`.
   */
  sanitizeFormulas?: boolean;
  /** Prefix applied by {@link sanitizeFormulas}. Default `'` (a single quote). */
  formulaPrefix?: string;
}

/** Full encoder options for a record type `T`. */
export interface CsvOptions<
  T extends object = CsvRecord
> extends CsvFormatOptions {
  /**
   * Columns to emit. When omitted, the columns are the stable union of every
   * record's keys, in first-seen order.
   */
  columns?: CsvColumns<T>;
}

/** A value produced by the parser when `dynamicTyping` is enabled. */
export type CsvParsedValue = string | number | boolean;

/** Per-record context passed to a {@link CsvRowMapper}. */
export interface CsvRowContext {
  /** The record's zero-based position among the emitted records. */
  readonly rowIndex: number;
}

/**
 * Map each raw parsed record into the final element. Use it to validate (for
 * example with a schema library) or reshape a record. The returned value is what
 * `parse` yields, so this is where runtime type safety can be enforced.
 */
export type CsvRowMapper<T> = (record: CsvRecord, context: CsvRowContext) => T;

/**
 * Column selection and renaming for parsing into a record type `T`.
 *
 * - An array of keys names each column by position and emits objects with those
 *   keys. With `header: true` the CSV header row is dropped in favor of these.
 * - A map of CSV header label to key renames and selects columns (header
 *   labels not in the map are dropped). Requires `header: true`.
 */
export type CsvParseColumns<T> =
  | readonly (keyof T & string)[]
  | Partial<Record<string, keyof T & string>>;

/** Options for {@link parse} and {@link createCsvParser}. */
export interface CsvParseOptions<T = CsvRecord> {
  /**
   * Treat the first row as the header and emit objects keyed by it. When
   * `false`, each record is the raw `string[]` of fields, unless `columns`
   * names them. Default `true`.
   */
  header?: boolean;
  /** Name, select, or rename the columns to emit. */
  columns?: CsvParseColumns<T>;
  /** Field separator, a single character, or `'auto'` to detect it. Default `,`. */
  separator?: string;
  /** Quote character. A single character. Default `"`. */
  quote?: string;
  /** Skip blank lines. `'greedy'` also drops whitespace-only lines. Default `true`. */
  skipEmptyLines?: boolean | 'greedy';
  /**
   * Lines beginning with this string are skipped. Default none. A line is
   * matched by its first field after quotes are parsed, so a quoted first field
   * that begins with this string also counts as a comment.
   */
  comment?: string;
  /**
   * Trim whitespace around every field value. Default `false`. This applies to
   * every field, including quoted ones, so whitespace inside quotes is trimmed
   * too. Leave it off to preserve values exactly.
   */
  trim?: boolean;
  /**
   * Strip a leading UTF-8 byte-order mark. When `undefined`, a BOM is stripped
   * if present. Set `false` to keep it.
   */
  bom?: boolean;
  /**
   * Coerce field text to `number` or `boolean` when it round-trips exactly
   * (so `"007"` and `"1.50"` stay strings). Only finite numbers are coerced, so
   * `"Infinity"`, `"-Infinity"`, and `"NaN"` stay strings. Default `false`.
   */
  dynamicTyping?: boolean;
  /** Throw on a row whose field count differs from the header. Default `false`. */
  strict?: boolean;
  /** Stop after this many records. Default unlimited. */
  maxRows?: number;
  /** Map or validate each raw record into the final element. */
  row?: CsvRowMapper<T>;
}

/** Input the streaming parser accepts: text, chunks, or a byte or text stream. */
export type CsvSource =
  | string
  | Iterable<string | Uint8Array>
  | AsyncIterable<string | Uint8Array>
  | ReadableStream<string | Uint8Array>;

/** A prepared parser. Call it with CSV text, or stream a source of chunks. */
export interface CsvParser<T = CsvRecord> {
  /** Parse a full CSV string into records. */
  (input: string): T[];
  /** Parse a streamed source into records, one at a time, with flat memory. */
  stream(source: CsvSource): AsyncIterable<T>;
}

/**
 * A prepared encoder. Call it with data to get a CSV string, or use its methods
 * for a single row or for streaming output.
 */
export interface CsvEncoder<T extends object = CsvRecord> {
  /** Encode a list (or any iterable) of records into one CSV string. */
  (data: Iterable<T>): string;
  /** Encode a single record into one CSV line, without a header. */
  row(record: T): string;
  /** Encode records as an async stream of string chunks. */
  stream(data: Iterable<T> | AsyncIterable<T>): AsyncIterable<string>;
}
