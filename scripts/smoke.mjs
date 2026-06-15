// Runtime-agnostic smoke test for the built package. Imports the ESM dist and
// asserts a few invariants, so the same file proves the bundle loads and works
// under Node, Deno, and Bun. A failed assertion throws, which exits non-zero in
// every runtime.
import {
  createCsvEncoder,
  createCsvParser,
  parse,
  stringify,
  toReadableStream
} from '../dist/index.js';

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`
    );
  }
}

const runtime =
  typeof globalThis.Deno !== 'undefined'
    ? 'Deno'
    : typeof globalThis.Bun !== 'undefined'
      ? 'Bun'
      : 'Node';

// Basic encoding and header inference.
assertEqual(
  stringify([{ name: 'Ada', age: 36 }]),
  'name,age\r\nAda,36',
  'basic stringify'
);

// RFC 4180 escaping of the separator, quotes, and line breaks.
assertEqual(
  stringify([{ value: 'a,b' }]),
  'value\r\n"a,b"',
  'separator is quoted'
);
assertEqual(
  stringify([{ value: 'a"b' }]),
  'value\r\n"a""b"',
  'quote is doubled and quoted'
);
assertEqual(
  stringify([{ value: 'a\nb' }]),
  'value\r\n"a\nb"',
  'newline is quoted'
);

// Single-row encoding through a prepared encoder.
const encode = createCsvEncoder({ columns: ['a', 'b'] });
assertEqual(encode.row({ a: 1, b: 2 }), '1,2', 'encoder row');

// Streaming through a web ReadableStream, available in all three runtimes.
const stream = toReadableStream(encode.stream([{ a: 1 }, { a: 2 }]));
const reader = stream.getReader();
let streamed = '';
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  streamed += value;
}
assertEqual(streamed, 'a,b\r\n1,\r\n2,', 'readable stream round-trip');

// Parsing: header inference, encode/parse round-trip, and streaming. Proves the
// other half of the library loads and works in every runtime.
assertEqual(
  JSON.stringify(parse('name,age\r\nAda,36')),
  JSON.stringify([{ name: 'Ada', age: '36' }]),
  'basic parse'
);

const original = [{ a: '1', b: 'x,y' }];
assertEqual(
  JSON.stringify(parse(stringify(original))),
  JSON.stringify(original),
  'encode then parse round-trip'
);

const parser = createCsvParser();
const parsedRows = [];
for await (const record of parser.stream(['a,b\n1,', '2\n3,4'])) {
  parsedRows.push(record);
}
assertEqual(
  JSON.stringify(parsedRows),
  JSON.stringify([
    { a: '1', b: '2' },
    { a: '3', b: '4' }
  ]),
  'stream parse round-trip'
);

console.log(`smoke: ${runtime} OK`);
