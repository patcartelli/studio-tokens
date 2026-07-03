/**
 * Generates tokens/ref/palette.json — M3 tonal palettes via Material Color Utilities.
 *
 * These values are PLACEHOLDERS until the real palettes are imported from Figma
 * through the Tokens Studio plugin (which overwrites this file on push).
 *
 * Usage: node scripts/generate-palettes.mjs [seedHex]   (default: #6750A4, the M3 baseline seed)
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { themeFromSourceColor, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

const seed = process.argv[2] ?? '#6750A4';
const theme = themeFromSourceColor(argbFromHex(seed));

const STANDARD_TONES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
// Extra neutral tones required by the M3 surface-container roles and dark scheme
const NEUTRAL_EXTRA_TONES = [4, 6, 12, 17, 22, 24, 87, 92, 94, 96, 98];

const palettes = {
  primary: { palette: theme.palettes.primary, tones: STANDARD_TONES },
  secondary: { palette: theme.palettes.secondary, tones: STANDARD_TONES },
  tertiary: { palette: theme.palettes.tertiary, tones: STANDARD_TONES },
  neutral: { palette: theme.palettes.neutral, tones: [...STANDARD_TONES, ...NEUTRAL_EXTRA_TONES].sort((a, b) => a - b) },
  'neutral-variant': { palette: theme.palettes.neutralVariant, tones: STANDARD_TONES },
  error: { palette: theme.palettes.error, tones: STANDARD_TONES },
};

const out = { ref: {} };
for (const [name, { palette, tones }] of Object.entries(palettes)) {
  out.ref[name] = {};
  for (const tone of tones) {
    out.ref[name][tone] = {
      value: hexFromArgb(palette.tone(tone)),
      type: 'color',
    };
  }
}

const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'tokens', 'ref', 'palette.json');
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${dest} from seed ${seed} (${Object.keys(palettes).length} palettes)`);
