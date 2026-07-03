# studio-tokens — Design (2026-07-03)

Approved design for the Studio Cartelli token system. Decisions made collaboratively; see README for day-to-day usage.

## Decisions

| Question | Decision |
|---|---|
| Relationship to site CSS | Full pipeline — this repo is the source of truth; Style Dictionary builds CSS custom properties |
| Distribution | Git dependency pinned to release tags: `github:patcartelli/studio-tokens#vX.Y.Z` |
| Token language | Material 3: `md.ref.palette.*` → `md.sys.color.*` aliasing, `md.sys.typescale.*` |
| CSS naming | M3 names in output + `compat.css` shim for legacy names; shim deleted after incremental migration |
| Palette values | Imported from Figma via Tokens Studio plugin (repo ships M3-baseline placeholders until then) |
| Display type sizing | clamp() endpoints tokenized (`-size-compact`, `-size-fluid`, spec size); build composes the clamp |
| Scope | Everything in global.css's token block: colors (light+dark), typography, spacing, layout, elevation, misc |
| Repo visibility | Public |

## Color role mapping (legacy → M3)

| Legacy var | M3 role |
|---|---|
| `--color-surface` / `--color-on-surface` | `surface` / `on-surface` |
| `--color-on-surface-dimmed` | `on-surface-variant` |
| `--color-on-surface-muted` | `outline` |
| `--color-border` | `outline-variant` |
| `--color-surface-subtle` | `surface-container` |
| `--color-accent` / `--color-accent-text` | `primary` / `on-primary-container` (yellow = primary key color) |
| `--color-error` | `error` |
| `--color-surface-footer` / `--color-on-surface-footer` | `inverse-surface` / `inverse-on-surface` |
| `--color-footer-link` | `inverse-primary` |
| footer muted/copyright/border | no M3 role — kept in `sc/extended` |

## Typography

- `ref.typeface.brand` = Polymath Display (display + headline roles), `plain` = Polymath Text (title/body/label), `mono` = DM Mono (extension).
- M3 spec sizes/weights/tracking; line heights as unitless ratios matching the site's existing values (which were themselves derived from M3).
- `--lh-body-relaxed` (1.65) is a Studio Cartelli extension in `sc/extended`.

## Non-M3 categories

Spacing, container, measure, grid, callout keep legacy names in output — M3 defines no token language for them. Elevation gets `--md-sys-elevation-level1..5` (M3 web shadow values); the site's card shadow stays visually identical as `--shadow-card` (theme-aware via `sc/extended.dark`).

## Site migration path

1. Install git dependency; import `tokens.css` + `compat.css`; delete global.css token block + its media query.
2. Day one: zero component changes (shim covers everything).
3. Components migrate to `--md-sys-*` incrementally; delete compat import when done.
4. Contrast CI (WCAG AA on paired roles) gates palette changes; visual review before each tag bump.

## Known caveats

- The site's current hand-tuned hexes will shift when real Figma palettes land — that's expected; review the visual diff before bumping the pin.
- Tokens Studio Themes tab is Pro; free tier toggles token sets manually. `$themes.json` in-repo drives builds regardless.
- Fixed-variant roles (`primary-fixed`, etc.) are omitted until needed.
