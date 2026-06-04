/** Base class for every error thrown by csv-pipe. */
export class CsvPipeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvPipeError';
  }
}

/**
 * Internal signal thrown by the coercion path when a value cannot be a CSV cell.
 * The row encoder catches it and rethrows a {@link CsvPipeError} with the row and
 * column where it happened. Not part of the public API.
 */
export class UnsupportedValueError extends Error {
  constructor(readonly value: unknown) {
    super('unsupported csv cell value');
    this.name = 'UnsupportedValueError';
  }
}

const ALLOWED_CELL =
  'a string, number, boolean, bigint, null, undefined, or an array of those';

function describe(value: unknown): string {
  if (typeof value === 'function') return 'a function';
  if (typeof value === 'symbol') return 'a symbol';
  return 'an object';
}

/** Build a located error for a cell value that cannot be encoded. */
export function unsupportedCellError(
  value: unknown,
  column: string,
  rowIndex: number
): CsvPipeError {
  return new CsvPipeError(
    `Cannot encode ${describe(value)} at row ${rowIndex}, column "${column}". ` +
      `A CSV cell must be ${ALLOWED_CELL}.`
  );
}
