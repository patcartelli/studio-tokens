/**
 * Strict JSON.parse over every tokens/ file — Style Dictionary's reader tolerates
 * things like trailing commas that Tokens Studio's plugin (and JSON.parse) reject.
 * Catches those before they reach Figma instead of only failing in the plugin.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'tokens');

function collect(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? collect(p) : p.endsWith('.json') ? [p] : [];
  });
}

let failures = 0;
for (const file of collect(root)) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    failures++;
    console.error(`✗ ${file.replace(root, 'tokens')}: ${e.message}`);
  }
}

if (failures) {
  console.error(`\n${failures} file(s) fail strict JSON parsing — Tokens Studio will refuse to open these.`);
  process.exit(1);
}
console.log(`✓ All token files are strict JSON.`);
