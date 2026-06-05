const CR = 13;
const LF = 10;

// States for the incremental tokenizer.
const FIELD_START = 0;
const IN_FIELD = 1;
const IN_QUOTED = 2;
const QUOTE_IN_QUOTED = 3;
const AFTER_QUOTE = 4;

/**
 * Split CSV text into rows of raw string fields in a single pass.
 *
 * Handles quoted fields that contain the separator, quotes, CR, LF, or CRLF,
 * with doubled-quote escaping per RFC 4180. The hot path is unquoted fields,
 * which are taken as a single `slice` with no per-character string building;
 * only doubled quotes inside a quoted field require concatenation.
 *
 * `separatorCode` and `quoteCode` are single UTF-16 code units (the parser
 * validates that the separator and quote are one character).
 */
export function tokenize(
  input: string,
  separatorCode: number,
  quoteCode: number
): string[][] {
  const rows: string[][] = [];
  const length = input.length;
  if (length === 0) return rows;

  let index = 0;
  let row: string[] = [];

  for (;;) {
    let value: string;

    if (index < length && input.charCodeAt(index) === quoteCode) {
      // Quoted field. Accumulate segments across any doubled quotes.
      index += 1;
      let segmentStart = index;
      value = '';
      let closed = false;
      while (index < length) {
        const code = input.charCodeAt(index);
        if (code === quoteCode) {
          if (input.charCodeAt(index + 1) === quoteCode) {
            // Doubled quote: keep one of the pair, skip both.
            value += input.slice(segmentStart, index + 1);
            index += 2;
            segmentStart = index;
          } else {
            // Closing quote.
            value += input.slice(segmentStart, index);
            index += 1;
            closed = true;
            break;
          }
        } else {
          index += 1;
        }
      }
      if (!closed) {
        // Unterminated quoted field at end of input: take what is there.
        value += input.slice(segmentStart, length);
        index = length;
      }
      // Ignore any stray characters between the closing quote and the next
      // separator or line break (lenient).
      while (index < length) {
        const code = input.charCodeAt(index);
        if (code === separatorCode || code === LF || code === CR) break;
        index += 1;
      }
    } else {
      // Unquoted field: one slice up to the next separator or line break.
      const start = index;
      while (index < length) {
        const code = input.charCodeAt(index);
        if (code === separatorCode || code === LF || code === CR) break;
        index += 1;
      }
      value = input.slice(start, index);
    }

    row.push(value);

    if (index >= length) {
      rows.push(row);
      break;
    }

    const terminator = input.charCodeAt(index);
    if (terminator === separatorCode) {
      index += 1;
      // Continue to the next field. A trailing separator leaves an empty field
      // that the next iteration produces before reaching end of input.
    } else {
      rows.push(row);
      row = [];
      index += terminator === CR && input.charCodeAt(index + 1) === LF ? 2 : 1;
      if (index >= length) break; // a trailing line break adds no empty row
    }
  }

  return rows;
}

/** A tokenizer fed string chunks, emitting complete rows as they arrive. */
export interface RowTokenizer {
  /** Feed a chunk; returns the rows completed within it. */
  push(chunk: string): string[][];
  /** Flush any final row held at end of input. */
  end(): string[][];
}

/**
 * Incremental sibling of {@link tokenize} for streaming. It keeps the partial
 * field, partial row, quote state, a pending CR (for a CRLF split across a chunk
 * boundary), and the quote-vs-doubled-quote decision between chunks, so any
 * chunking of the same input yields the same rows as {@link tokenize}.
 */
export function createRowTokenizer(
  separatorCode: number,
  quoteCode: number
): RowTokenizer {
  let state = FIELD_START;
  let field = '';
  let row: string[] = [];
  let sawCR = false;
  const quoteChar = String.fromCharCode(quoteCode);

  function push(chunk: string): string[][] {
    const out: string[][] = [];
    const length = chunk.length;
    let index = 0;

    while (index < length) {
      const code = chunk.charCodeAt(index);

      // A CRLF whose CR ended the previous read: swallow the following LF.
      if (sawCR) {
        sawCR = false;
        if (code === LF) {
          index += 1;
          continue;
        }
      }

      if (state === IN_QUOTED) {
        if (code === quoteCode) {
          state = QUOTE_IN_QUOTED;
          index += 1;
          continue;
        }
        let scan = index;
        while (scan < length && chunk.charCodeAt(scan) !== quoteCode) scan += 1;
        field += chunk.slice(index, scan);
        index = scan;
        continue;
      }

      if (state === QUOTE_IN_QUOTED) {
        if (code === quoteCode) {
          field += quoteChar; // doubled quote, keep one
          state = IN_QUOTED;
          index += 1;
        } else {
          state = AFTER_QUOTE; // the previous quote closed the field
        }
        continue;
      }

      if (state === AFTER_QUOTE) {
        if (code === separatorCode) {
          row.push(field);
          field = '';
          state = FIELD_START;
        } else if (code === LF) {
          row.push(field);
          field = '';
          out.push(row);
          row = [];
          state = FIELD_START;
        } else if (code === CR) {
          row.push(field);
          field = '';
          out.push(row);
          row = [];
          state = FIELD_START;
          sawCR = true;
        }
        index += 1; // a stray character after the closing quote is ignored
        continue;
      }

      // FIELD_START or IN_FIELD
      if (state === FIELD_START) {
        if (code === quoteCode) {
          state = IN_QUOTED;
          index += 1;
          continue;
        }
        state = IN_FIELD;
      }

      if (code === separatorCode) {
        row.push(field);
        field = '';
        state = FIELD_START;
        index += 1;
        continue;
      }
      if (code === LF) {
        row.push(field);
        field = '';
        out.push(row);
        row = [];
        state = FIELD_START;
        index += 1;
        continue;
      }
      if (code === CR) {
        row.push(field);
        field = '';
        out.push(row);
        row = [];
        state = FIELD_START;
        sawCR = true;
        index += 1;
        continue;
      }

      let scan = index;
      while (scan < length) {
        const next = chunk.charCodeAt(scan);
        if (next === separatorCode || next === LF || next === CR) break;
        scan += 1;
      }
      field += chunk.slice(index, scan);
      index = scan;
    }

    return out;
  }

  function end(): string[][] {
    if (state === FIELD_START && field === '' && row.length === 0) return [];
    row.push(field);
    const out = [row];
    field = '';
    row = [];
    state = FIELD_START;
    return out;
  }

  return { push, end };
}
