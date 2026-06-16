// Renders the social card at 4K in 16:9 (3840x2160) for LinkedIn or any
// high-resolution use. It reuses the exact OG card design (vector, so it scales
// crisply), centered in a 16:9 canvas, and writes to media/, which is not part
// of the npm package or the docs site. Run with `npm run og:linkedin`.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildSvg } from './og.mjs';

// 1280x720 keeps a 16:9 canvas; rendering at width 3840 yields 3840x2160 (4K).
// `cover` fills the 16:9 frame, cropping only the card's empty side padding.
const svg = buildSvg(1280, 720, { cover: true });

const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 3840 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' }
})
  .render()
  .asPng();

mkdirSync('media', { recursive: true });
writeFileSync('media/linkedin-4k.png', png);
console.log('media/linkedin-4k.png written (3840x2160, 16:9)');
