# LoanOver Brand

Brand kit for LoanOver — a Brazilian personal-finance app (debt payoff + cash-flow projection)
with a B2B "Business" variant for SMB cash management. This is a **token + reference kit**, not a
compiled component library: build UI with plain HTML/CSS (or your own React) using ONLY the
vocabulary below. All copy is pt-BR, sentence case.

## Vocabulary — CSS custom properties (the only colors you may use)

Defined in `tokens/colors.css` and `tokens/type.css`; all reachable via `styles.css`.

**Personal (default product):** `--lo-green` (accent/hero bg), `--lo-green-deep` (footer, CTA
text on white), `--lo-cream` (page bg), `--lo-ink` / `--lo-ink-muted` (text), `--lo-line`
(hairlines), `--lo-surface` (chips/cards on light zones).

**Business (choose when the surface is the B2B product):** `--lo-biz-bg` (page), `--lo-biz-hero`
(raised bg), `--lo-biz-deep` (darkest), `--lo-biz-steel` (accent), `--lo-biz-ink` /
`--lo-biz-ink-muted` (text), `--lo-biz-line`, `--lo-biz-surface`. Never mix the two palettes in
one design; `--lo-success` stays green in BOTH (it marks debt liberation).

**Semantic:** `--lo-success`, `--lo-warning`, `--lo-error`, `--lo-info`.

**Type:** `--lo-font-sans` (Inter — headlines 800, body 400, buttons 600/800) and
`--lo-font-mono` (JetBrains Mono 700 — logo, kickers, and ALL numbers with
`font-variant-numeric: tabular-nums`). Radii: `--lo-radius-field` (0.5rem, inputs/buttons),
`--lo-radius-box` (0.75rem, cards), `--lo-radius-pill` (CTAs/chips).

## Brand rules

- Logo is always lowercase mono 700, letter-spacing -0.02em: `// loan over`. Slashes take the
  accent color (`--lo-green`, or `--lo-biz-steel` in business), words take the text color; all
  white on saturated backgrounds. The `//` prefix is the brand motif — kickers are written
  `// section name` in mono uppercase with 0.2em tracking.
- Hero/CTA sections sit on `--lo-green` (or `--lo-biz-hero`) with the blueprint grid texture:
  1px white lines at 9% alpha every 40px + 16% alpha every 200px (see
  `components/brand/BlueprintGrid`).
- Motion: one easing only — `var(--lo-ease)` = cubic-bezier(0.25, 0.46, 0.45, 0.94); durations
  0.3–0.6s; wipes travel at the slash angle (skewX(-20deg)). Reference implementation:
  `components/brand/LogoAnimation`.
- Flat color only: no gradients, no drop shadows (a soft `shadow` on white cards is the one
  exception).

## Where the truth lives

Read `styles.css` → `tokens/colors.css` + `tokens/type.css` before styling anything. Reference
cards: `components/brand/Logo`, `components/brand/LogoAnimation` (the full animated brand
reveal), `components/brand/BlueprintGrid`, `components/colors/Palettes`,
`components/type/Typography`, `components/ui/Buttons` (pill CTA, primary button, chip, ghost —
both palettes).

## Idiomatic snippet

```html
<section style="background:var(--lo-green); padding:64px; text-align:center;
                font-family:var(--lo-font-sans)">
  <p style="font-family:var(--lo-font-mono); font-size:11px; letter-spacing:0.2em;
            text-transform:uppercase; color:rgba(255,255,255,0.7)">// projeção</p>
  <h1 style="color:#fff; font-weight:800; font-size:56px; letter-spacing:-0.02em">
    Descubra quando você fica livre das dívidas</h1>
  <button style="background:#fff; color:var(--lo-green-deep); font-weight:800;
                 border:0; border-radius:var(--lo-radius-pill); padding:14px 30px">
    Começar gratuitamente →</button>
</section>
```
