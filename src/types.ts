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
