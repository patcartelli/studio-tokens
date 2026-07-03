/**
 * WCAG contrast gate for paired M3 color roles, run against the built CSS.
 * Fails (exit 1) if any on-X/X text pair drops below 4.5:1 in either scheme.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'css', 'tokens.css'),
  'utf8'
);

function parseBlock(selectorRe) {
  const m = selectorRe.exec(css);
  if (!m) throw new Error(`Selector not found: ${selectorRe}`);
  const vars = {};
  for (const decl of m[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[decl[1]] = decl[2].trim();
  return vars;
}

const lightVars = parseBlock(/:root\s*\{([^}]*)\}/);
const darkVars = { ...lightVars, ...parseBlock(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/) };

function resolve(name, vars, depth = 0) {
  if (depth > 10) throw new Error(`Reference loop at ${name}`);
  const value = vars[name];
  if (!value) throw new Error(`Missing variable ${name}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  return ref ? resolve(ref[1], vars, depth + 1) : value;
}

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a hex color: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

const PAIRS = [
  ['on-surface', 'surface'],
  ['on-surface-variant', 'surface'],
  ['on-primary', 'primary'],
  ['on-primary-container', 'primary-container'],
  ['on-secondary', 'secondary'],
  ['on-secondary-container', 'secondary-container'],
  ['on-tertiary', 'tertiary'],
  ['on-tertiary-container', 'tertiary-container'],
  ['on-error', 'error'],
  ['on-error-container', 'error-container'],
  ['inverse-on-surface', 'inverse-surface'],
];

const THRESHOLD = 4.5;
let failures = 0;

for (const [scheme, vars] of [['light', lightVars], ['dark', darkVars]]) {
  for (const [fg, bg] of PAIRS) {
    const r = ratio(
      resolve(`--md-sys-color-${fg}`, vars),
      resolve(`--md-sys-color-${bg}`, vars)
    );
    const ok = r >= THRESHOLD;
    if (!ok) failures++;
    console.log(
      `${ok ? '✓' : '✗'} [${scheme}] ${fg} on ${bg}: ${r.toFixed(2)}:1${ok ? '' : ` (< ${THRESHOLD}:1)`}`
    );
  }
}

if (failures) {
  console.error(`\n${failures} contrast pair(s) below ${THRESHOLD}:1 — fix palette tones before releasing.`);
  process.exit(1);
}
console.log('\nAll contrast pairs pass WCAG AA.');
