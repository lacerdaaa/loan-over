# Loan Over — Full Project Plan

## Context
A personal finance app focused on debt tracking and cash-flow projection. The differentiator is the **projection engine**: it simulates the next N months, detects exactly when each debt closes, and surfaces those moments as cash-liberation events. The user stops paying installments and has that money freed for savings goals. Three phases: business rules lock-in → backend → frontend.

---

## Phase 1 — Business Rules

### Entities

| Entity | Fields | Notes |
|--------|--------|-------|
| **Income** | type: `fixed\|variable`, amount: number, period: `{month, year}`, description: string | Fixed repeats automatically; variable registered month by month |
| **FixedExpense** | name, amount, due_day: int, active: boolean | Monthly recurring, non-debt (rent, health plan, etc.) |
| **Debt** | name, installment_amount, total_installments, paid_installments, start_date, closed | `payoff_date` is **derived**, never input |

### Derived fields (Debt)
```
remaining_installments = total_installments - paid_installments
amount_paid            = paid_installments × installment_amount
remaining_amount       = remaining_installments × installment_amount
payoff_date            = start_date + total_installments months
closed                 = remaining_installments === 0   (set automatically)
```

### Monthly Snapshot (period = month + year)
```
total_income   = Σ Income active in that month
total_debts    = Σ installment_amount of open debts in that month
total_fixed    = Σ FixedExpense where active === true
free_balance   = total_income - total_debts - total_fixed
```

### Projection engine rules
For each month in horizon (default 24):
1. List debts with `remaining_installments > 0` at that month
2. If a debt's `payoff_date` falls in this month → tag event `"liberation"` with amount freed
3. Accumulate: `projected_balance += free_balance + Σ liberated amounts from prior months`
4. Stack liberation events so freed installment value compounds forward

### Automation rules
- `paid_installments` incremented manually **or** via monthly cron job
- When `paid_installments === total_installments` → set `closed = true`, debt exits all future calculations immediately (next month)
- Alerts: when `remaining_installments === 1`; again on `payoff_date` month

### Savings Goal
```
target_amount   : number
deadline        : {month, year}
current_amount  : derived — free_balance accumulated
projection      : "you will reach this goal in X months"
suggestion      : on debt closure → "redirect R$X to your goal"
```

---

## Phase 2 — Backend (NestJS)

### Project structure
```
backend/
  src/
    income/
      income.entity.ts
      income.service.ts
      income.controller.ts
      income.module.ts
    fixed-expense/
      fixed-expense.entity.ts
      fixed-expense.service.ts
      fixed-expense.controller.ts
      fixed-expense.module.ts
    debt/
      debt.entity.ts
      debt.service.ts
      debt.controller.ts
      debt.module.ts
    snapshot/
      snapshot.service.ts      ← pure calc, no DB
      snapshot.controller.ts
      snapshot.module.ts
    projection/
      projection.service.ts    ← pure calc, no DB, receives data → returns month array
      projection.controller.ts
      projection.module.ts
    goal/
      goal.entity.ts
      goal.service.ts
      goal.controller.ts
      goal.module.ts
    app.module.ts
    main.ts
```

### Stack
- **NestJS** + **TypeORM** + **SQLite** (dev) / **PostgreSQL** (prod)
- `class-validator` + `class-transformer` for DTOs
- No auth for now (single-user local app)

### Key design decisions
- `projection.service.ts` is **stateless** — accepts a `ProjectionInput` DTO (all entity data already fetched), returns `ProjectedMonth[]`. Zero DB calls. Trivially testable.
- `snapshot.service.ts` same pattern — receives raw data, returns computed snapshot for a given `{month, year}`.
- Debt closure logic lives in `debt.service.ts`: after any `paid_installments` update, recalculate `closed`.
- Monthly cron (`@Cron`) in `debt.service.ts` auto-increments installments for active debts.

### Core types
```ts
// ProjectedMonth
{
  month: number;
  year: number;
  free_balance: number;
  events: Array<{ type: 'liberation' | 'alert'; description: string; amount: number }>;
  active_debts: number;
  total_outflow: number;
}
```

### API surface (REST)
```
POST   /income
GET    /income?month=&year=
DELETE /income/:id

POST   /fixed-expenses
GET    /fixed-expenses
PATCH  /fixed-expenses/:id
DELETE /fixed-expenses/:id

POST   /debts
GET    /debts
PATCH  /debts/:id/pay           ← increments paid_installments by 1
DELETE /debts/:id

GET    /snapshot?month=&year=   ← current month computed view
GET    /projection?horizon=24   ← future months array

POST   /goal
GET    /goal
PATCH  /goal
```

---

## Phase 3 — Frontend (React)

### Stack
- **React + TypeScript** (Vite)
- **TanStack Query** for server state
- **Recharts** for the timeline chart
- **React Router** for navigation
- **Tailwind CSS** — dark theme, financial aesthetic

### Screens

#### 1. Dashboard `/`
- Current month snapshot card: Income / Outflow / Free Balance
- Mini debt list: name + remaining_installments + next payoff date
- Shortcut to timeline

#### 2. Timeline `/timeline`
- Horizontal scrollable chart — 24 months
- Bar chart: `free_balance` per month (green = positive, red = negative)
- Green spike markers on liberation months with tooltip (which debt closed + amount freed)
- Alert badge on months with `remaining_installments === 1`

#### 3. Debts `/debts`
- List with progress bar (paid_installments / total_installments)
- Quick-pay button → `PATCH /debts/:id/pay`
- Add / edit form

#### 4. Income `/income`
- Toggle fixed vs. variable
- Month picker for variable income registration

#### 5. Fixed Expenses `/fixed-expenses`
- Simple CRUD table with active toggle

#### 6. Goal `/goal`
- target_amount + deadline inputs
- Progress bar: current_amount / target_amount
- Projection string: "you will reach this goal in X months"
- Suggestion cards when a debt closes

### Component hierarchy
```
App
├── Layout (nav sidebar)
├── DashboardPage
│   ├── SnapshotCard
│   └── DebtMiniList
├── TimelinePage
│   └── ProjectionChart       ← Recharts ComposedChart
├── DebtsPage
│   ├── DebtList
│   └── DebtForm
├── IncomePage
├── FixedExpensesPage
└── GoalPage
    └── GoalProgress
```

---

## Verification plan
1. **Backend unit tests** — `projection.service.spec.ts`: feed mock debt/income data, assert correct `free_balance` and liberation events at the right months
2. **Backend e2e** — create a debt with 3 installments, pay 2, call `/projection?horizon=3`, assert month 3 has a `liberation` event
3. **Frontend** — start dev server, add a debt, navigate to timeline, visually confirm green spike at the correct month
4. **Cron** — manually trigger the auto-increment, verify `closed` flips to `true` when `paid_installments === total_installments`
