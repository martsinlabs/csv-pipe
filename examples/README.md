# Examples

Runnable snippets for the common tasks. Each file imports `csv-pipe` and is
type-checked in CI, so they stay in sync with the library.

| File                                   | Shows                                                     |
| -------------------------------------- | --------------------------------------------------------- |
| [basic.ts](basic.ts)                   | Encode an array of objects into a CSV string.             |
| [columns.ts](columns.ts)               | Select, order, and label columns.                         |
| [formatting.ts](formatting.ts)         | Transform values with the `format` hook.                  |
| [streaming-node.ts](streaming-node.ts) | Stream to a file with flat memory (`writeCsv`, Readable). |
| [streaming-web.ts](streaming-web.ts)   | Serve a CSV as an HTTP response (`toReadableStream`).     |
| [read-file.ts](read-file.ts)           | Read and parse a file as a stream (`readCsv`).            |
| [security.ts](security.ts)             | Guard against spreadsheet formula injection.              |

Run one with any TypeScript runner, for example:

```
npx tsx examples/basic.ts
```
