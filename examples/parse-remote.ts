// Parse a CSV fetched over HTTP at flat memory. A fetch Response exposes its
// body as a Web ReadableStream, and the parser's stream method consumes that
// stream chunk by chunk, so the file is decoded incrementally and never fully
// held in memory. A tiny in-process server stands in for a real endpoint to
// keep the example self-contained; swap in any URL.
import { createCsvParser } from 'csv-pipe';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

type Launch = { mission: string; year: number; success: boolean };

const csv =
  'mission,year,success\n' +
  'Sputnik 1,1957,true\n' +
  'Apollo 11,1969,true\n' +
  'Mariner 1,1962,false\n';

const server = createServer((_request, response) => {
  response.setHeader('content-type', 'text/csv; charset=utf-8');
  response.end(csv);
});
await new Promise<void>((resolve) => server.listen(0, resolve));
const { port } = server.address() as AddressInfo;

// dynamicTyping coerces each cell, so year is a number and success a boolean.
const parser = createCsvParser<Launch>({ dynamicTyping: true });

try {
  const response = await fetch(`http://localhost:${port}/launches.csv`);
  if (!response.body) throw new Error('The response has no body to stream.');

  // response.body is a ReadableStream<Uint8Array>; stream decodes, tokenizes,
  // and yields one typed record at a time.
  for await (const launch of parser.stream(response.body)) {
    console.log(launch.mission, launch.year, launch.success);
  }
  // Sputnik 1 1957 true
  // Apollo 11 1969 true
  // Mariner 1 1962 false
} finally {
  server.close();
}
