// Generates shields endpoint JSON for the coverage and bundle-size badges.
// Inputs: coverage/coverage-summary.json (vitest json-summary) and size.json
// (`size-limit --json`). Outputs into public/, which CI publishes to gh-pages.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('public', { recursive: true });

function writeBadge(file, label, message, color) {
  const badge = { schemaVersion: 1, label, message, color };
  writeFileSync(`public/${file}`, JSON.stringify(badge, null, 2));
}

const coverage = JSON.parse(
  readFileSync('coverage/coverage-summary.json', 'utf8')
);
const linePct = coverage.total.lines.pct;
const coverageColor =
  linePct >= 90 ? 'brightgreen' : linePct >= 75 ? 'yellow' : 'orange';
writeBadge('coverage-badge.json', 'coverage', `${linePct}%`, coverageColor);

const sizes = JSON.parse(readFileSync('size.json', 'utf8'));
const fullEntry =
  sizes.find((entry) => entry.name === 'full entry') ?? sizes[0];
const kilobytes = (fullEntry.size / 1024).toFixed(2);
writeBadge('size-badge.json', 'min+brotli', `${kilobytes} kB`, 'blue');
