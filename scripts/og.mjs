// Renders the social card to docs/public/og.png. Run with `npm run og` after
// changing the branding. The PNG is committed, so CI just deploys it.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cp" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#4aa247" />
      <stop offset="1" stop-color="#2f6b2e" />
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.08" r="0.75">
      <stop stop-color="#1f6f2e" stop-opacity="0.5" />
      <stop offset="1" stop-color="#0d1117" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0d1117" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <g fill="#ffffff" opacity="0.05">
    <rect x="770" y="120" width="360" height="14" rx="7" />
    <rect x="770" y="172" width="300" height="14" rx="7" />
    <rect x="770" y="224" width="386" height="14" rx="7" />
    <rect x="770" y="276" width="250" height="14" rx="7" />
    <rect x="770" y="328" width="330" height="14" rx="7" />
  </g>
  <g transform="translate(100,140)">
    <rect width="120" height="120" rx="28" fill="url(#cp)" />
    <g fill="#ffffff" transform="scale(3.75)">
      <rect x="6" y="9" width="10" height="2.6" rx="1.3" />
      <rect x="6" y="14.7" width="13" height="2.6" rx="1.3" />
      <rect x="6" y="20.4" width="7.5" height="2.6" rx="1.3" />
    </g>
    <path transform="scale(3.75)" d="M21.5 16h4.2M23.6 13.2l3 2.8-3 2.8" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>
  <text x="252" y="205" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff">csv-pipe</text>
  <text x="256" y="252" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="400" fill="#7ee787">Typed CSV, encode and parse, for every runtime</text>
  <text x="100" y="392" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#c9d1d9">RFC 4180 correct. Checked against your data.</text>
  <text x="100" y="440" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#c9d1d9">The same core on Node, browsers, Deno, Bun, and edge.</text>
  <text x="100" y="556" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#8b949e">Zero dependencies&#160;&#160;·&#160;&#160;~1.6 kB&#160;&#160;·&#160;&#160;Streaming&#160;&#160;·&#160;&#160;Type-safe</text>
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  .render()
  .asPng();
writeFileSync('docs/public/og.png', png);
console.log('docs/public/og.png written');
