# studio-tokens

Design tokens for [Studio Cartelli](https://github.com/patcartelli/studio-cartelli), built on the **Material 3 token architecture**: reference tonal palettes (`md.ref.palette.*`) aliased into system roles (`md.sys.color.*`, `md.sys.typescale.*`), edited in Figma via **Tokens Studio**, compiled to CSS custom properties with **Style Dictionary**.

## Structure

```
tokens/                  Tokens Studio JSON — the source of truth
  ref/palette.json       M3 tonal palettes (primary…error × tones 0–100)
  ref/typeface.json      brand (Polymath Display) / plain (Polymath Text) / mono (DM Mono)
  ref/key.json           white/black, key-color seeds, MTB source seed
  sys/color.light.json   M3 color roles → palette aliases, light scheme ("Schemes" group)
  sys/color.dark.json    M3 color roles → palette aliases, dark scheme ("Schemes" group)
  sys/state.json         Hover/focus/press state-layer overlays ("State Layers" group)
  sys/surfaces.json      Elevation surface-tint overlays
  sys/shape.json         M3 corner-radius scale ("Shape" collection)
  sys/typescale.json     M3 typescale on Studio Cartelli fonts (+ emphasized variants, clamp endpoints)
  sc/extended.json       Non-M3 categories: spacing, layout, grid, elevation, footer one-offs, custom colors ("Studio Cartelli" group)
  sc/extended.dark.json  Dark-scheme overrides for extended tokens
build/build.mjs          Style Dictionary v4 + @tokens-studio/sd-transforms
dist/css/tokens.css      Generated: :root (light) + :root[data-theme="dark"]
dist/css/compat.css      Legacy-name shim (--color-surface → --md-sys-color-surface, …)
```

`dist/` is committed; CI fails if it drifts from a fresh build.

> **Palette provenance:** neutral, neutral-variant, secondary, and error ramps come from the Figma Material Theme Builder export (see the `figma-import` branch); missing neutral surface-container tones were backfilled from the export's resolved scheme values. **Primary is graphite** (generated from `#181818`, the original Figma key color) with a documented deviation: light-scheme `primary` renders at tone 20, not spec tone 40. **Tertiary is the brand yellow** (generated from `#f5c542`); it powers `--color-accent` (tone 80, fixed), `--color-accent-text` (sys tertiary), and the `--color-number-emphasis` / `--color-number-marker` stat treatments. `npm run generate:palettes -- '#RRGGBB'` regenerates all ramps from a single seed if ever needed.

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Compile `tokens/` → `dist/css/` |
| `npm run check:contrast` | WCAG AA gate on paired roles (on-surface/surface, …), both schemes |
| `npm run generate:palettes -- '#hex'` | Regenerate `ref/palette.json` tonal palettes from a seed color |
| `npm run verify` | Build + contrast check + dist drift check (what CI runs) |

## Consuming (studio-cartelli)

```jsonc
// package.json
"dependencies": { "studio-tokens": "github:patcartelli/studio-tokens#v0.1.0" }
```

```css
@import 'studio-tokens/css/tokens.css';
@import 'studio-tokens/css/compat.css'; /* until components use --md-sys-* directly */
```

Replaces the `:root` token block (and the `--container-padding`/`--grid-gap` media query) in `global.css`. The site's `data-theme="dark"` toggle works unchanged. Update = tag a release here, bump the pinned tag there.

## Tokens Studio workflow (Pro)

1. **Sync provider** (Settings → Sync providers → GitHub): fine-grained PAT scoped to this repo (Contents: Read and write), repository `patcartelli/studio-tokens`, branch **`main`**, token storage location `tokens` (the directory — multi-file mode). The `figma-import` branch is historical (raw Material Theme Builder export) — never point the plugin at it.
2. **Themes dropdown** (top-left): eight flat theme groups, each its own Figma collection (no `M3` wrapper) — `Schemes`, `State Layers`, `Studio Cartelli` (all light/dark modes), `Reference` (palette + key colors, single mode), `Surfaces` (light/dark), `Typescale`, `Font theme`, `Shape` (all single mode).
3. **Edit loop**: pull before editing → edit tokens → push to `main` → CI rebuilds `dist/` and gates on WCAG AA contrast + drift.
4. **Export to Figma** (Styles & Variables → Export): exports all three collections in one pass. Settings: variables all on; styles Typography + Effects only (color styles are redundant next to variables); "Create styles with variable references" ON; "Update existing style and variable names" ON; "Remove styles and variables without connection to a token" ON once the file contains no hand-made styles worth keeping.
5. **Push after every export** — the plugin stamps Figma collection/mode IDs into `$themes.json`; committing them makes future exports update the same collection instead of creating duplicates.

## Naming notes

- Typescale variables follow M3's published CSS names: `--md-sys-typescale-body-large-size`, `-weight`, `-tracking`, `-font`, `-line-height`.
- Display sizes compile to `clamp(compact, fluid, spec)` — Figma shows the spec size (57/45/36), CSS stays responsive.
- Line heights are emitted as unitless ratios (M3 px values ÷ font size), matching how the site applies them.
- Each type role has an **`-emphasized` sibling** (M3 Expressive) — same size/line-height/tracking, bold weight (`weight-bold`, 700) instead of regular/medium.
- `sc/extended` tokens keep their legacy names in output (`--space-md`, `--container-max`, `--shadow-card`, …) since M3 has no vocabulary for them.

### Figma-facing structure vs. CSS output

Token source files are rooted at flat, Material Theme Builder-style groups — `typescale`, `Schemes`, `ref`, `white`/`black`, `key-colors`, `source`, `surfaces`, `State Layers`, `shape`, `Studio Cartelli` — instead of nesting three levels under a repeated `md.sys.*`/`md.ref.*`. This mirrors Google's own Material 3 Design Kit's organization (collections: `M3`, `Typescale`, `Font theme`, `Shape`; groups within `M3`: `Schemes`, `State Layers`, `Add-ons`) rather than everything buried under `md / sys / ...`. One deliberate deviation: our custom, non-spec colors (`number-emphasis`, footer family) live in a `Studio Cartelli` group rather than M3's `Add-ons` — that term specifically means extra seed-generated brand color ramps (full tone/container/on-* sets), not simple value overrides, so mislabeling ours as `Add-ons` would misrepresent the M3 vocabulary.

The build's `name/m3-remap` transform (`build/build.mjs`) reconstructs the spec-correct `--md-sys-*`/`--md-ref-*`/legacy `--color-*` CSS variable name from each token's original path — so **the Figma-facing organization and the CSS output are decoupled**: reorganize the JSON for navigability without ever touching a published variable name. `compat.css` and the site are unaffected by this structure.

- The footer palette (`--color-surface-footer`, `--color-on-surface-footer`, `--color-footer-link`, and its muted/copyright/border grays) is **fixed dark in both site themes by design** — it does not alias the M3 `inverse-surface` roles, which intentionally invert per scheme.
- `--color-footer-link` and `--color-accent` both resolve to the fixed `tertiary.80` reference — the brand yellow key color, unaffected by theme.
- Polymath's "Regular" cut is weight 500, not 400 — `md.ref.typeface.weight-regular` reflects that; `weight-bold` (700) is available for future use.

## Releasing

```sh
npm run verify
git tag v0.x.y && git push --tags
# then bump the pinned tag in studio-cartelli
```
