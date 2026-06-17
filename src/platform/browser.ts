/**
 * Browser helpers, imported from `csv-pipe/browser`.
 *
 * @module csv-pipe/browser
 */
import { stringify } from '../encode/stringify';
import type { CsvOptions, CsvRecord } from '../types';

/** Options for {@link downloadCsv}: every encoder option plus file metadata. */
export interface DownloadCsvOptions<
  T extends object = CsvRecord
> extends CsvOptions<T> {
  /** Suggested file name for the download. Default `"data.csv"`. */
  filename?: string;
  /** Blob MIME type. Default `"text/csv;charset=utf-8"`. */
  mimeType?: string;
}

/**
 * Encode `data` and trigger a browser download. Browser only: it uses `document`
 * and `URL`. The object URL is revoked after the click, so nothing leaks.
 */
export function downloadCsv<T extends object>(
  data: readonly T[],
  options: DownloadCsvOptions<T> = {}
): void {
  const {
    filename = 'data.csv',
    mimeType = 'text/csv;charset=utf-8',
    ...csvOptions
  } = options;

  const blob = new Blob([stringify(data, csvOptions)], { type: mimeType });
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Revoke on the next tick so the browser can read the blob before it is freed.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
