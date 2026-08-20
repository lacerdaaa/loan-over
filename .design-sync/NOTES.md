# design-sync notes — LoanOver

- This repo is an APP (NestJS + React), not a component library. Scope chosen with the user
  (2026-08-20): hand-authored **brand kit** (`ds-bundle/`, committed as source of truth), not a
  converter run. No `_ds_bundle.js`, no `_ds_sync.json` anchor — every sync re-uploads and
  re-verifies; that is the honest state per the skill.
- Brand values sourced from `frontend/src/lib/brand.ts` (PALETTES) and `frontend/src/index.css`
  (daisyUI themes). If those change, regenerate `ds-bundle/tokens/colors.css` to match.
- Verification bar for this kit: static HTML cards; token-reference and @dsCard-marker checks
  run via grep (no browser screenshot harness available in this environment). Re-run the grep
  checks after any card edit.
- Fonts load from Google Fonts inside `styles.css` (`Inter`, `JetBrains Mono`) — the app itself
  uses system stacks; the named fonts are the ad/design art direction.
