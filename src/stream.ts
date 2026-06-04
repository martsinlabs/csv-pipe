/**
 * Adapt an async iterable of string chunks into a Web `ReadableStream`. Useful
 * as an HTTP response body or for any Web Streams consumer. Works in browsers,
 * Deno, Bun, edge runtimes, and Node 18+.
 *
 * In Node you can also pass an encoder stream straight to `Readable.from(...)`.
 */
export function toReadableStream(
  source: AsyncIterable<string>
): ReadableStream<string> {
  const iterator = source[Symbol.asyncIterator]();

  return new ReadableStream<string>({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    async cancel(reason) {
      await iterator.return?.(reason);
    }
  });
}
