# studio-tokens

Design tokens for [Studio Cartelli](https://github.com/patcartelli/studio-cartelli), built on the **Material 3 token architecture**: reference tonal palettes (`md.ref.palette.*`) aliased into system roles (`md.sys.color.*`, `md.sys.typescale.*`), edited in Figma via **Tokens Studio**, compiled to CSS custom properties with **Style Dictionary**.

## Structure

```
tokens/                  Tokens Studio JSON — the source of truth
  ref/palette.json       M3 tonal palettes (primary…error × tones 0–100)
  ref/typeface.json      brand (Polymath Display) / plain (Polymath Text) / mono (DM Mono)
  sys/color.light.json   M3 color roles → palette aliases, light scheme
  sys/color.dark.json    M3 color roles → palette aliases, dark scheme
  sys/typescale.json     M3 typescale on Studio Cartelli fonts (+ responsive clamp endpoints)
  sc/extended.json       Non-M3 categories: spacing, layout, grid, elevation, footer one-offs
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

## Tokens Studio setup

1. **Install** the "Tokens Studio for Figma" plugin (free tier is fine).
2. **PAT**: GitHub → Settings → Developer settings → Fine-grained tokens → new token scoped to this repo with **Contents: Read and write**.
3. **Add sync provider** in the plugin (Settings → Sync providers → GitHub): repository `patcartelli/studio-tokens`, branch `main`, token storage location `tokens` (the directory — this enables multi-file mode).
4. **Pull** — the set list should show `ref/palette`, `ref/typeface`, `sys/color.light`, `sys/color.dark`, `sys/typescale`, `sc/extended`, `sc/extended.dark`.
5. **Import your Figma color variables** into `ref/palette` (Tools → Import variables), naming tones to match the alias targets: `md.ref.palette.primary.40`, `md.ref.palette.neutral.98`, etc. Broken-reference indicators disappearing in the `sys/` sets confirm the wiring.
6. **Push** to `main` — CI rebuilds and verifies.
7. **Light/dark preview** (free tier): toggle enabled sets manually — `sys/color.light` ⇄ `sys/color.dark` (+ `sc/extended.dark`). The Themes tab is a Pro feature; `$themes.json` drives the build regardless.

## Naming notes

- Typescale variables follow M3's published CSS names: `--md-sys-typescale-body-large-size`, `-weight`, `-tracking`, `-font`, `-line-height`.
- Display sizes compile to `clamp(compact, fluid, spec)` — Figma shows the spec size (57/45/36), CSS stays responsive.
- Line heights are emitted as unitless ratios (M3 px values ÷ font size), matching how the site applies them.
- `sc/extended` tokens keep their legacy names in output (`--space-md`, `--container-max`, `--shadow-card`, …) since M3 has no vocabulary for them.

## Releasing

```sh
npm run verify
git tag v0.x.y && git push --tags
# then bump the pinned tag in studio-cartelli
```
