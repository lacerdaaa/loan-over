# Loan Over

Personal finance app for debt tracking and cash-flow projection. The core idea: make the cost of each debt visible month by month, detect exactly when each one is paid off, and surface that moment as a **liberation event** — because when a debt closes, that installment amount becomes free money forever.

---

## What the app does

You register your income, fixed expenses, debts, and any one-off expenses for the month. The app computes how much money you actually have left (your **free balance**) and projects that number 24 months forward, showing you when each debt closes and how your balance grows as a result.

There is also a **financial plan** (Goal page) that uses the Snowball method to tell you in which order to attack your debts to get free the fastest, with a parallel minimum savings target while you do it.

---

## Entities

### Income

Stored fields:

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `type` | `fixed` \| `variable` | Fixed incomes apply every month; variable incomes apply only to the month/year they are registered for |
| `category` | `salary` \| `rent` \| `benefit` \| `other` | Determines whether the income enters the free balance calculation. `benefit` incomes are tracked separately and do **not** contribute to `free_balance` |
| `amount` | decimal | Gross amount |
| `month` | int \| null | Only set when `type = variable` |
| `year` | int \| null | Only set when `type = variable` |
| `description` | string | Label shown in UI |
| `deductions` | IncomeDeduction[] | List of deductions (e.g. INSS, IR) subtracted from gross to compute net |

Derived:

- **`net_amount`** = `amount − sum(deductions)` — computed by `netAmount()` in `income.utils.ts`, never stored

Income resolution for a given month: all `fixed` incomes + all `variable` incomes that match that specific `month` and `year`.

---

### IncomeDeduction

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `label` | string | e.g. "INSS", "IR" |
| `amount` | decimal | Amount deducted from parent income |
| `income` | Income | Parent (many-to-one) |

---

### FixedExpense

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | string | Label |
| `amount` | decimal | Monthly cost |
| `due_day` | int | Day of month it is due (informational, not used in calculations) |
| `active` | boolean | Inactive expenses are excluded from all calculations |
| `from_benefit` | boolean | If `true`, this expense is paid from benefit income and is excluded from `free_balance`. It is tracked separately so the user can see where benefit money goes |

---

### Debt

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | string | Label (e.g. "Shopee", "Inter \| Crédito") |
| `installment_amount` | decimal | Monthly installment value |
| `total_installments` | int | Total number of installments |
| `paid_installments` | int | How many have been paid so far |
| `start_date` | date | When the debt started |
| `closed` | boolean | `true` when fully paid. Set automatically when `paid_installments = total_installments` |

Derived:

- **`remaining_installments`** = `total_installments − paid_installments`
- **`remaining_balance`** = `remaining_installments × installment_amount`
- **`payoff_date`** = `start_date + total_installments months` (informational, computed on frontend)

---

### OccasionalExpense

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `description` | string | Label |
| `amount` | decimal | One-off cost |
| `month` | int | Month this expense belongs to |
| `year` | int | Year this expense belongs to |
| `from_benefit` | boolean | Same semantics as `FixedExpense.from_benefit` — excluded from `free_balance` if `true` |

---

### Goal

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `target_amount` | decimal | Savings target in BRL |
| `deadline_month` | int | User's intended deadline (month) |
| `deadline_year` | int | User's intended deadline (year) |
| `monthly_min` | decimal \| null | Minimum amount to save every month even while paying off debts |

There is at most one Goal record in the database (the API upserts into it).

---

### User

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `google_id` | string | Unique identifier from Google OAuth |
| `email` | string | Google account email |
| `name` | string \| null | Display name |
| `avatar` | string \| null | Profile photo URL |

---

## Snapshot logic

A **monthly snapshot** is a point-in-time calculation for a specific month and year. It is stateless — computed on every request from the raw entity data, never persisted.

```
GET /snapshot?month=6&year=2026
```

**Inputs:** all incomes for that month (fixed always + variable if month/year match), all debts, all fixed expenses, all occasional expenses for that month.

**Calculation:**

```
total_income      = sum of net_amount for all non-benefit incomes in the month
total_fixed       = sum of active fixed expenses where from_benefit = false
total_debts       = sum of installment_amount for all open (non-closed) debts
total_occasional  = sum of occasional expenses for the month where from_benefit = false
total_benefit     = sum of net_amount for benefit-category incomes
total_debt_balance = sum of (remaining_installments × installment_amount) for open debts

free_balance = total_income − total_fixed − total_debts − total_occasional
```

`total_benefit` and benefit-flagged expenses are excluded from `free_balance` by design. Benefit income (e.g. Flash Food card) is restricted-use money — it cannot be freely spent, so it must not inflate the free balance.

---

## Projection engine

The projection is a stateless forward simulation computed over N months (default 24).

```
GET /projection?month=6&year=2026&months=24
```

**Inputs:** all incomes, all fixed expenses, all debts (open only matter), reference month and year.

**How it works:**

For each future offset `i` from 1 to N:

1. **Fixed income base** — only `fixed`-type, non-benefit incomes. Variable incomes are excluded from projections because they are one-off and cannot be reliably assumed to repeat.
2. **Fixed expense base** — active, non-benefit expenses. These are assumed to stay constant.
3. **Active debt installments at offset `i`** — a debt is active at offset `i` if `i < remaining_installments`. Once `i >= remaining_installments`, that debt no longer appears in the outflow.
4. **`free_balance`** = `fixed_income − fixed_expenses − active_debt_installments`

No occasional expenses appear in projections. They are by definition non-recurring.

### Liberation events

When a debt's last installment falls at offset `i` (`i === remaining_installments`), the engine emits a **liberation event** for that month:

```json
{
  "type": "liberation",
  "description": "Shopee fully paid — R$129.18/month freed",
  "amount": 129.18
}
```

The freed amount is the installment value that was subtracted from outflow every month up to that point. From `i+1` onward, that amount is no longer in the active debt total, so `free_balance` increases by exactly that value. The "staircase" shape in the projection chart is the visible result of cascading liberation events.

### Alert events

The month before a debt closes (`i === remaining_installments − 1`), the engine emits an **alert event**:

```json
{
  "type": "alert",
  "description": "Shopee — last installment next month",
  "amount": 129.18
}
```

This signals the user that a liberation is coming next month.

---

## Automation rules

### Monthly auto-increment (cron)

Every 1st day of the month at midnight, the server runs `DebtService.autoIncrementInstallments()`:

1. Loads all open debts.
2. Increments `paid_installments` by 1 for each.
3. If `paid_installments === total_installments`, sets `closed = true`.

This means the system self-advances without any user action required. The user only needs to register debts once.

### Manual pay installment

A user can also call `PATCH /debts/:id/pay` to increment `paid_installments` manually. The same `closed` check applies — the debt closes automatically when fully paid.

### Debt closure rule

`closed = true` if and only if `paid_installments === total_installments`. This is enforced in both the cron and the manual pay endpoint. Closed debts are excluded from all snapshot and projection calculations.

---

## Financial plan — Two-Phase Snowball

The Goal page implements the **Two-Phase Snowball** methodology.

### Phase 1 — Debt wipeout

While any open debt exists:

1. Each month, reserve `monthly_min` (the user's minimum savings commitment) from `free_balance`. If `free_balance < monthly_min`, save whatever is available.
2. The remainder (`free_balance − monthly_min`) is applied as an **extra payment** to the debt with the **lowest remaining balance** (i.e., `remaining_installments × installment_amount`). This is the Snowball ordering — smallest balance first to maximise psychological momentum and velocity.
3. The extra payment reduces that debt's remaining months: `remaining_months -= extra / installment_amount`.
4. When a debt reaches zero remaining months, its installment amount is added to `free_balance` for all subsequent months — the "cascade" effect.
5. Repeat until all debts reach zero.

### Phase 2 — Full savings mode

Once all debts are cleared, the entire `free_balance` (which is now much larger due to all freed installments) goes to savings each month until `target_amount` is reached.

The simulation is **pure frontend** — no backend endpoint. It runs in `useMemo` on the Goal page using the current snapshot's `free_balance` and the open debt list as inputs. It returns:

- `debtFreeOffset` — months from now until all debts clear
- `goalOffset` — months from now until `target_amount` is reached
- `debtOrder` — sorted list of debts in Snowball order, each with their accelerated payoff month and months saved vs natural payoff
- `postDebtMonthlyFree` — the free balance available during Phase 2

---

## Benefit income & expenses — isolation model

The `benefit` category exists to model restricted-use income (e.g. a food card that can only be spent on food). The isolation rule:

- Benefit income is tracked via `total_benefit` in the snapshot but **excluded from `free_balance`**.
- Fixed and occasional expenses marked `from_benefit = true` are also **excluded from `free_balance`**.
- This means benefit money and benefit spending cancel each other out and do not affect the user's real available cash.

The Dashboard shows `total_benefit` as a separate card so the user can see how much restricted-use money they have and where it is going.

---

## API summary

| Method | Path | Description |
|---|---|---|
| GET | `/snapshot` | Monthly snapshot for a given month/year |
| GET | `/projection` | N-month forward projection |
| GET/POST/DELETE | `/income` | Manage incomes |
| POST/DELETE | `/income/:id/deductions` | Manage deductions on an income |
| GET/POST/PATCH/DELETE | `/debts` | Manage debts |
| PATCH | `/debts/:id/pay` | Manually advance one installment |
| GET/POST/PATCH/DELETE | `/fixed-expenses` | Manage fixed expenses |
| GET/POST/DELETE | `/occasional-expenses` | Manage occasional expenses |
| GET/POST/DELETE | `/goal` | Upsert the single goal record |
| GET | `/auth/google` | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | OAuth callback, issues JWT |
| GET | `/auth/me` | Returns current user from JWT |
