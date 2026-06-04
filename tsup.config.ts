import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'index.ts',
    browser: 'src/platform/browser.ts',
    node: 'src/platform/node.ts'
  },
  format: ['esm', 'cjs'],
  dts: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2022',
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  }
});
