# LoanOver Business — enterprise mode plan

Decisions (2026-08-20): target buyer is the **SMB managing its own cash flow**; first delivery is
**landing switch + business theme only** (waitlist CTA, no backend); business theme is
**slate + steel blue**.

## Positioning

- **Personal** (current): "Descubra quando você fica livre das dívidas."
- **Business**: "Saiba quantos meses de caixa sua empresa tem." Cash-flow clarity and runway for
  small companies — the same projection engine, applied to revenues, payroll, and financings.

The core differentiator carries over unchanged: liberation events become *"o financiamento X quita
em junho — R$ 2.400/mês voltam ao caixa"*.

## Concept mapping (existing engine → business domain)

| Existing module | Business meaning | New work needed |
|---|---|---|
| `income` (fixed/variable + deductions) | Receitas: contratos recorrentes (MRR) e vendas pontuais; deductions = impostos (Simples/ISS) e taxas de cartão | Relabeling + tax-oriented deduction presets |
| `fixed-expense` (active, valid_from) | Custos fixos: folha, pró-labore, aluguel, software; `valid_from` = nova contratação | Relabeling only |
| `debt` (Price, liberation) | Financiamentos, empréstimos, parcelamento de impostos (REFIS), antecipação de recebíveis | Relabeling only |
| `occasional-expense` | Despesas pontuais: 13º, férias, equipamento | Relabeling; later auto-provisioning |
| `snapshot` | Fluxo de caixa do mês: burn, margem, saldo livre | Unchanged (pure) |
| `projection` | Runway + linha do tempo de liberações | Unchanged (pure); runway needs a cash-balance input |
| `goal` | Reserva / capital de giro alvo | Relabeling only |

## Business feature set (advertised on landing, built in phases)

1. **Runway em tempo real** — months of cash at current burn; requires one new stored value
   (current cash balance) fed into the projection.
2. **Projeção de caixa 24 meses** — existing engine, business labels.
3. **Fim de financiamentos** — liberation events framed as cash returning to the operation.
4. **Cenários de receita** — projection run with revenue multipliers (pessimista/base/otimista).
5. **Provisionamento de folha** — 13º and férias auto-generated as occasional expenses.
6. **Relatório mensal / DRE simplificada** — export for the accountant (extends existing export).
7. **Multi-usuário por empresa** — owner, financeiro, contador (read-only). The only true
   enterprise backend feature; last phase.

## Phase 1 — landing switch + theme (first delivery, frontend only)

### Behavior

- Pill toggle **"Pessoal / Empresas"** in the floating navbar; also reachable via `?mode=business`
  so the business page is directly linkable.
- Switching crossfades all copy blocks and swaps the palette. Animations respect the existing
  motion patterns; no layout change, only content + colors.
- Personal CTA keeps Google auth. Business CTA is a **waitlist** action (`mailto:` with subject
  "LoanOver Business" in phase 1 — no backend).

### Theme tokens (business palette, added to `frontend/src/lib/brand.ts`)

Restructure `brand.ts` from loose constants into two palette objects with the same shape, so
landing components take a palette instead of importing globals:

| Token | Personal (current values) | Business |
|---|---|---|
| `bg` | CREAM `oklch(98.5% 0.007 145)` | `oklch(22% 0.02 250)` slate |
| `hero` | GREEN `oklch(66% 0.179 155)` | `oklch(27% 0.025 250)` raised slate |
| `deep` | GREEN_DEEP `oklch(28% 0.055 155)` | `oklch(16% 0.02 250)` |
| `accent` | GREEN | `oklch(60% 0.12 250)` steel blue |
| `ink` | INK `oklch(25% 0.045 155)` | `oklch(93% 0.01 250)` |
| `inkMuted` | INK_MUTED | `oklch(93% 0.01 250 / 0.55)` |
| `line` | LINE (green /0.18) | `oklch(60% 0.12 250 / 0.22)` |

`TutorialModal` and `LoginPage` still reference the personal palette explicitly.

### Business copy (pt-BR, draft)

- Badge: `gestão de caixa para empresas`
- H1: `Saiba quantos meses de caixa sua empresa tem`
- Sub: `Projete receitas, folha e financiamentos por 24 meses. Veja quando cada parcela acaba e
  quanto caixa volta para a operação.`
- Features 01–04: Runway em tempo real · Projeção de caixa 24 meses · Fim de financiamentos ·
  Cenários de receita
- Steps: Cadastre receitas e contratos → Registre custos e financiamentos → Veja o runway e
  quando o caixa respira
- Chips: `Runway` · `Folha de pagamento` · `Financiamentos` · `Cenários`
- CTA section: `Chega de descobrir o buraco no caixa no fim do mês.` / button
  `Entrar na lista de espera`

### Files touched (phase 1)

- `frontend/src/lib/brand.ts` — palette objects (personal + business)
- `frontend/src/pages/LandingPage.tsx` — mode state, toggle, per-mode content sets, palette prop
  threading, URL param
- `frontend/src/pages/LoginPage.tsx`, `frontend/src/components/ui/TutorialModal.tsx` — update
  imports if constant names change (no visual change)

## Phase 2 — business accounts (backend)

- `organization` entity (name, cnpj optional, cash_balance); user gains `account_type`
  (`personal | business`) chosen at first login after OAuth.
- App-side daisyUI theme `loanover-business` (slate/steel, same token structure as existing
  themes in `index.css`).
- Business dashboard: runway stat (cash_balance ÷ burn), relabeled modules, same routes.
- Projection controller accepts `cash_balance` to emit runway per month.

## Phase 3 — differentiation

- Payroll provisioning (13º/férias auto occasional entries), revenue scenarios
  (multiplier param on the pure projection — keeps it stateless), DRE-style export.

## Phase 4 — enterprise

- Multi-user organizations with roles (owner / financeiro / contador read-only), invitations,
  audit trail on mutations.

## Out of scope (explicitly)

- Bank integrations / Open Finance, invoicing (NF-e), payments — LoanOver stays a projection
  tool, not an ERP.
