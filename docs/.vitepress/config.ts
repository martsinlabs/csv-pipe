import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { fileURLToPath } from 'node:url';
import { defineConfig, type MarkdownOptions } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json';

const srcRoot = fileURLToPath(new URL('../../src', import.meta.url));

type SidebarItem = {
  text: string;
  link?: string;
  collapsed?: boolean;
  items?: SidebarItem[];
};

// The generated sidebar wraps everything in a single "csv-pipe" module group.
// Lift that group's items to the top so the API list shows without the wrapper.
const generated = typedocSidebar as SidebarItem[];
const apiSidebar =
  generated.length === 1 && generated[0]?.items
    ? generated[0].items
    : generated;

export default defineConfig({
  title: 'csv-pipe',
  description:
    'A small, fast, zero-dependency CSV encoder and parser for TypeScript and JavaScript.',
  base: '/csv-pipe/',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://martsinlabs.github.io/csv-pipe/' },
  markdown: {
    codeTransformers: [
      // transformerTwoslash is typed against its own @shikijs/types copy, which
      // differs from the one vitepress bundles; the shapes match at runtime, so
      // cast to the transformer type vitepress expects.
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            baseUrl: srcRoot,
            paths: {
              'csv-pipe': ['./index.ts'],
              'csv-pipe/node': ['./platform/node.ts'],
              'csv-pipe/browser': ['./platform/browser.ts']
            }
          }
        }
      }) as unknown as NonNullable<MarkdownOptions['codeTransformers']>[number]
    ]
  },
  head: [
    [
      'link',
      { rel: 'icon', type: 'image/svg+xml', href: '/csv-pipe/favicon.svg' }
    ],
    ['meta', { name: 'theme-color', content: '#3c7d3a' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'csv-pipe' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Typed, RFC 4180 CSV encoding and parsing for every JavaScript runtime.'
      }
    ],
    [
      'meta',
      { property: 'og:url', content: 'https://martsinlabs.github.io/csv-pipe/' }
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://martsinlabs.github.io/csv-pipe/og.png'
      }
    ],
    ['meta', { property: 'og:image:type', content: 'image/png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    [
      'meta',
      {
        property: 'og:image:alt',
        content: 'csv-pipe: typed CSV encode and parse for every runtime'
      }
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: 'https://martsinlabs.github.io/csv-pipe/og.png'
      }
    ],
    [
      'meta',
      {
        name: 'twitter:image:alt',
        content: 'csv-pipe: typed CSV encode and parse for every runtime'
      }
    ]
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      { text: 'Benchmarks', link: '/guide/benchmarks' },
      {
        text: 'Changelog',
        link: 'https://github.com/martsinlabs/csv-pipe/blob/master/CHANGELOG.md'
      }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Why csv-pipe', link: '/guide/why' },
            { text: 'Comparison', link: '/guide/comparison' },
            { text: 'Migration', link: '/guide/migration' }
          ]
        },
        {
          text: 'Encoding',
          items: [
            { text: 'Choosing columns', link: '/guide/columns' },
            { text: 'Formatting values', link: '/guide/formatting' },
            { text: 'Streaming', link: '/guide/streaming' },
            { text: 'Options', link: '/guide/options' }
          ]
        },
        {
          text: 'Parsing',
          items: [
            { text: 'Parsing', link: '/guide/parsing' },
            { text: 'Choosing columns', link: '/guide/parsing-columns' },
            { text: 'Typing and validation', link: '/guide/parsing-typing' },
            { text: 'Streaming and files', link: '/guide/parsing-streaming' },
            { text: 'Options', link: '/guide/parsing-options' }
          ]
        },
        {
          text: 'More',
          items: [
            { text: 'TypeScript', link: '/guide/typescript' },
            { text: 'Error handling', link: '/guide/errors' },
            { text: 'Security', link: '/guide/security' }
          ]
        },
        {
          text: 'Reference',
          items: [
            { text: 'Benchmarks', link: '/guide/benchmarks' },
            { text: 'Examples', link: '/guide/examples' }
          ]
        }
      ],
      '/api/': apiSidebar
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/martsinlabs/csv-pipe' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/csv-pipe' }
    ],
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/martsinlabs/csv-pipe/edit/master/docs/:path',
      text: 'Edit this page on GitHub'
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Martsin Labs'
    }
  }
});
