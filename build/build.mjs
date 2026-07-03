/**
 * Builds dist/css/tokens.css (+ copies compat.css) from the Tokens Studio sources.
 *
 * - Light theme  → :root
 * - Dark theme   → :root[data-theme="dark"]  (only the tokens that differ)
 * - Display sizes are composed into clamp(compact, fluid, spec) after the SD build,
 *   so Figma sees clean M3 spec sizes while CSS output stays responsive.
 */
import StyleDictionary from 'style-dictionary';
import { register, expandTypesMap } from '@tokens-studio/sd-transforms';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(root, 'dist', 'tmp');

register(StyleDictionary);

// Token source files are rooted at flat, MTB-style groups (typescale, Schemes,
// ref, white/black, key-colors, source, surfaces, State Layers, shape, Studio
// Cartelli) instead of the deeper md.sys.*/md.ref.* nesting — so Tokens Studio/
// Figma groups them as shallow siblings (matching Material Theme Builder's own
// kit organization: Schemes / State Layers / Add-ons as flat groups) rather than
// three levels deep under a repeated "md" root. This transform reconstructs the
// spec-correct "--md-sys-*"/"--md-ref-*"/legacy "--color-*" CSS variable name
// from each token's original path (token.path, set before any name transform
// runs), so the built CSS is byte-identical either way — only the Figma-facing
// token path changed.
StyleDictionary.registerTransform({
  name: 'name/m3-remap',
  type: 'name',
  transform: (token) => {
    const p = token.path;
    // Path segments can carry internal camelCase (typography expansion emits
    // "fontSize", not "font-size") — split that before joining with hyphens.
    const toKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    const j = (arr) => arr.map(toKebab).join('-');
    switch (p[0]) {
      case 'typescale':
        return j(['md', 'sys', ...p])
          .replace(/-font-size$/, '-size')
          .replace(/-font-weight$/, '-weight')
          .replace(/-letter-spacing$/, '-tracking')
          .replace(/-font-family$/, '-font');
      case 'Schemes':
        return j(['md', 'sys', 'color', ...p.slice(1)]);
      case 'ref':
        return j(['md', 'ref', 'palette', ...p.slice(1)]);
      case 'white':
      case 'black':
        return j(['md', 'ref', 'palette', ...p]);
      case 'key-colors':
        return j(['md', 'ref', 'key-color', ...p.slice(1)]);
      case 'source':
        return j(['md', 'ref', ...p]);
      case 'surfaces':
        return j(['md', 'sys', 'surface', ...p.slice(1)]);
      case 'State Layers':
        return j(['md', 'sys', 'state', ...p.slice(1)]);
      case 'shape':
        return j(['md', 'sys', ...p]);
      case 'Studio Cartelli':
        return j(['color', ...p.slice(1)]);
      default:
        return token.name; // already kebab-cased by name/kebab (typeface, sc/extended)
    }
  },
});

const common = {
  preprocessors: ['tokens-studio'],
  expand: { include: ['typography'], typesMap: expandTypesMap },
};

const light = new StyleDictionary({
  ...common,
  source: [
    'tokens/ref/palette.json',
    'tokens/ref/typeface.json',
    'tokens/ref/key.json',
    'tokens/sys/color.light.json',
    'tokens/sys/state.json',
    'tokens/sys/surfaces.json',
    'tokens/sys/shape.json',
    'tokens/sys/typescale.json',
    'tokens/sc/extended.json',
  ].map((p) => join(root, p)),
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      transforms: ['name/kebab', 'name/m3-remap'],
      buildPath: tmp + '/',
      files: [
        {
          destination: 'light.css',
          format: 'css/variables',
          options: {
            // State-layer rgba() composes an alpha onto a referenced color — var()
            // can't be unpacked inside rgba(), so those must inline their values.
            outputReferences: (token) =>
              !token.filePath.includes('sys/state') && !token.filePath.includes('sys/surfaces'),
            selector: ':root',
          },
        },
      ],
    },
  },
});

const dark = new StyleDictionary({
  ...common,
  include: [join(root, 'tokens/ref/palette.json')],
  source: [
    join(root, 'tokens/sys/color.dark.json'),
    // State layers + tint overlays re-emit in the dark block so their rgba() resolves against dark roles.
    join(root, 'tokens/sys/state.json'),
    join(root, 'tokens/sys/surfaces.json'),
    join(root, 'tokens/sc/extended.dark.json'),
  ],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      transforms: ['name/kebab', 'name/m3-remap'],
      buildPath: tmp + '/',
      files: [
        {
          destination: 'dark.css',
          format: 'css/variables',
          // Palette refs live in the :root block, not this one — inline values instead.
          options: { outputReferences: false, selector: ':root[data-theme="dark"]' },
          filter: (token) => !token.filePath.includes('ref/palette'),
        },
      ],
    },
  },
});

await light.buildAllPlatforms();
await dark.buildAllPlatforms();

let lightCss = readFileSync(join(tmp, 'light.css'), 'utf8');
const darkCss = readFileSync(join(tmp, 'dark.css'), 'utf8');

// Compose responsive clamp() for the six display sizes (regular + emphasized).
for (const role of [
  'display-large', 'display-medium', 'display-small',
  'display-large-emphasized', 'display-medium-emphasized', 'display-small-emphasized',
]) {
  const base = `--md-sys-typescale-${role}-size`;
  const spec = new RegExp(`${base}: ([^;]+);`).exec(lightCss)?.[1].trim();
  const fluid = new RegExp(`${base}-fluid: ([^;]+);`).exec(lightCss)?.[1].trim();
  if (!spec || !fluid) throw new Error(`Missing clamp inputs for ${role}`);
  lightCss = lightCss.replace(
    `${base}: ${spec};`,
    `${base}: clamp(var(${base}-compact), ${fluid}, ${spec});`
  );
}

const banner = `/**
 * studio-tokens — generated by Style Dictionary. Do not edit directly.
 * Source of truth: tokens/ (synced with Tokens Studio).
 */
`;

mkdirSync(join(root, 'dist', 'css'), { recursive: true });
writeFileSync(join(root, 'dist', 'css', 'tokens.css'), banner + '\n' + lightCss + '\n' + darkCss);
copyFileSync(join(root, 'src', 'compat.css'), join(root, 'dist', 'css', 'compat.css'));
rmSync(tmp, { recursive: true, force: true });

console.log('Built dist/css/tokens.css and dist/css/compat.css');
