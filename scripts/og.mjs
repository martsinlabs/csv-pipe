// Renders the social card to docs/public/og.png. Run with `npm run og` after
// changing the branding. The PNG is committed, so CI just deploys it.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

// The card content is laid out in a 1200x630 box. buildSvg centers it in any
// canvas, so the same design renders at other aspect ratios (for example 16:9).
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

const defs = `<defs>
    <linearGradient id="cp" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#5cbb58" />
      <stop offset="1" stop-color="#2f6b2e" />
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.12" r="0.7">
      <stop stop-color="#2aa84a" stop-opacity="0.32" />
      <stop offset="1" stop-color="#0b0e14" stop-opacity="0" />
    </radialGradient>
  </defs>`;

const content = `  <g transform="translate(80,92)">
    <rect width="104" height="104" rx="24" fill="url(#cp)" />
    <g fill="#ffffff" transform="scale(3.25)">
      <rect x="6" y="9" width="10" height="2.6" rx="1.3" />
      <rect x="6" y="14.7" width="13" height="2.6" rx="1.3" />
      <rect x="6" y="20.4" width="7.5" height="2.6" rx="1.3" />
    </g>
    <path transform="scale(3.25)" d="M21.5 16h4.2M23.6 13.2l3 2.8-3 2.8" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>

  <text x="208" y="150" font-family="Helvetica, Arial, sans-serif" font-size="78" font-weight="700" fill="#ffffff">csv-pipe</text>
  <text x="210" y="194" font-family="Helvetica, Arial, sans-serif" font-size="27" font-weight="500" fill="#6ee79a">Typed CSV, encode and parse</text>

  <text x="80" y="312" font-family="Helvetica, Arial, sans-serif" font-size="33" fill="#c9d1d9">Fully typed. Streams both ways.</text>
  <text x="80" y="360" font-family="Helvetica, Arial, sans-serif" font-size="33" fill="#c9d1d9">RFC 4180. Zero dependencies.</text>

  <text x="80" y="556" font-family="Helvetica, Arial, sans-serif" font-size="25" font-weight="600" fill="#8b949e">Node&#160;&#160;·&#160;&#160;Browser&#160;&#160;·&#160;&#160;Deno&#160;&#160;·&#160;&#160;Bun&#160;&#160;·&#160;&#160;Edge</text>

  <rect x="624" y="120" width="496" height="318" rx="18" fill="#11161d" stroke="#ffffff" stroke-opacity="0.08" />
  <circle cx="656" cy="156" r="6" fill="#ff5f56" />
  <circle cx="678" cy="156" r="6" fill="#febc2e" />
  <circle cx="700" cy="156" r="6" fill="#28c840" />
  <line x1="624" y1="184" x2="1120" y2="184" stroke="#ffffff" stroke-opacity="0.06" />
  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="19">
    <text x="652" y="214" xml:space="preserve"><tspan fill="#ff7b72">const </tspan><tspan fill="#79c0ff">rows</tspan><tspan fill="#ff7b72"> = </tspan><tspan fill="#e6edf3">[{ name: </tspan><tspan fill="#a5d6ff">'Ada'</tspan><tspan fill="#e6edf3">, age: </tspan><tspan fill="#79c0ff">36</tspan><tspan fill="#e6edf3"> }]</tspan></text>
    <text x="652" y="268" xml:space="preserve"><tspan fill="#ff7b72">const </tspan><tspan fill="#79c0ff">csv</tspan><tspan fill="#ff7b72">  = </tspan><tspan fill="#7ee787">stringify</tspan><tspan fill="#e6edf3">(</tspan><tspan fill="#79c0ff">rows</tspan><tspan fill="#e6edf3">)</tspan></text>
    <text x="652" y="298" fill="#8b949e">// name,age</text>
    <text x="652" y="328" fill="#8b949e">// Ada,36</text>
    <text x="652" y="382"><tspan fill="#7ee787">parse</tspan><tspan fill="#e6edf3">(</tspan><tspan fill="#79c0ff">csv</tspan><tspan fill="#e6edf3">)</tspan></text>
    <text x="652" y="412" fill="#8b949e">// [{ name: 'Ada', age: '36' }]</text>
  </g>`;

/**
 * Build the card SVG for a canvas of the given size. The content is scaled and
 * centered. `contain` (default) fits the whole card inside the canvas; `cover`
 * fills the canvas, cropping only the card's empty outer padding, so a taller
 * frame (for example 16:9) has no margins. At 1200x630 the scale is 1.
 */
export function buildSvg(
  width = CARD_WIDTH,
  height = CARD_HEIGHT,
  { cover = false } = {}
) {
  const fit = cover ? Math.max : Math.min;
  const scale = fit(width / CARD_WIDTH, height / CARD_HEIGHT);
  const dx = (width - CARD_WIDTH * scale) / 2;
  const dy = (height - CARD_HEIGHT * scale) / 2;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${width}" height="${height}" fill="#0b0e14" />
  <rect width="${width}" height="${height}" fill="url(#glow)" />
  <rect width="${width}" height="6" fill="url(#cp)" />
  <g transform="translate(${dx},${dy}) scale(${scale})">
${content}
  </g>
</svg>`;
}

export const svg = buildSvg();

const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' }
})
  .render()
  .asPng();
writeFileSync('docs/public/og.png', png);
console.log('docs/public/og.png written');
