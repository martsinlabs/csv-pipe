/** @type {import('dts-bundle-generator/config-schema').BundlerConfig} */
const output = { noBanner: true, exportReferencedTypes: false };

module.exports = {
  compilationOptions: {
    preferredConfigPath: './tsconfig.json'
  },
  entries: [
    { filePath: './index.ts', outFile: './dist/index.d.ts', output },
    {
      filePath: './src/platform/browser.ts',
      outFile: './dist/browser.d.ts',
      output
    },
    { filePath: './src/platform/node.ts', outFile: './dist/node.d.ts', output }
  ]
};
