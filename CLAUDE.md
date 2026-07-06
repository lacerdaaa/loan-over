# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview
Personal finance app for debt tracking and cash-flow projection. Core differentiator: a stateless projection engine that simulates N months forward, detects debt payoff moments, and surfaces them as cash-liberation events. See `docs/plan.md` for full business rules.

---

## Commands

### Backend (`backend/`)
```bash
npm run start:dev       # watch mode
npm run test            # all unit tests
npm run test:e2e        # e2e tests
npx jest snapshot       # run a single spec by name pattern
npm run migration:generate -- src/migrations/DescriptiveName
npm run migration:run
npm run migration:revert
```

### Frontend (`frontend/`)
```bash
npm run dev             # Vite dev server (requires VITE_API_URL in .env)
npm run build           # tsc + vite build
npm run lint            # eslint
```

### Infrastructure
```bash
docker compose up -d    # start PostgreSQL (port 5432)
```

Backend env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`.
Frontend env: `VITE_API_URL` (e.g. `http://localhost:3000`).

---

## Architecture

### Stack
- **Backend**: NestJS + TypeORM + PostgreSQL, `class-validator` DTOs, Swagger at `/api`
- **Frontend**: React 19 + TypeScript + Vite, TanStack Query v5, DaisyUI v5 (Tailwind), Framer Motion v12, Recharts

### Domain modules (backend)
Each module owns its entity, service, controller, and DTOs. Cross-module access goes through the module's exported service only.

| Module | Responsibility |
|--------|---------------|
| `income` | Fixed and variable incomes with deductions |
| `fixed-expense` | Recurring monthly expenses with `active` toggle |
| `debt` | Installment debts; supports Tabela Price (principal + monthly_rate → computes PMT) |
| `occasional-expense` | One-off expenses scoped to a specific month/year |
| `snapshot` | **Pure computation** — `SnapshotService.compute()` receives all entities and returns `MonthlySnapshot` with no I/O |
| `projection` | **Pure computation** — `ProjectionService.project()` simulates N months forward, emits `liberation` events when debts are paid off |
| `goal` | User's savings target (amount + deadline) |
| `auth` | Google OAuth2 → JWT. `JwtAuthGuard` on all routes. Token carries `sub` (userId), `email`, `name`, `avatar` |
| `user` | Minimal user record (google_id, email, name, avatar) |

`SnapshotService` and `ProjectionService` are intentionally stateless and repository-free — keep them that way. They are the only services with 100% branch-coverage unit tests.

### Data flow
```
GET /snapshot?month=&year=
  → SnapshotController gathers [incomes, debts, fixedExpenses, occasionalExpenses]
  → SnapshotService.compute() → MonthlySnapshot (pure, tested)

GET /projection?months=
  → ProjectionController gathers same inputs (minus occasionalExpenses)
  → ProjectionService.project() → ProjectedMonth[] (pure, tested)
```

### Auth flow
Google OAuth (`/auth/google`) → callback issues JWT → stored in `localStorage` as `loanover_token` → Axios interceptor in `frontend/src/api/client.ts` attaches `Authorization: Bearer` on every request → 401 redirects to `/login`.

### Frontend patterns
- **API hooks**: one file per domain in `frontend/src/api/` wrapping TanStack Query. Mutations invalidate the relevant query key on success.
- **Privacy mode**: `usePrivacy()` context (`frontend/src/lib/privacy.tsx`). Use `mask(formatCurrency(x))` for amounts and `blur-sm select-none` CSS class for names/descriptions.
- **Animations**: `useAnimations()` context (`frontend/src/lib/animations.tsx`). Gate Framer Motion animations on `enabled`.
- **TypeORM decimal columns**: PostgreSQL returns `DECIMAL` as strings. Always wrap with `Number()` before sending back from the frontend or computing in the service.

### Migrations
Always generate via `npm run migration:generate` — never write migrations by hand. Timestamp prefix is auto-assigned. Run `migration:run` after generating.

---

## Development workflow — TDD is mandatory

Every feature must follow the **red → green → refactor** cycle. No exceptions.

### The cycle
1. **Red** — write a failing test that describes the behavior. Run it and confirm it fails for the right reason (not a compile error, not a wrong assertion message).
2. **Green** — write the minimum code to make the test pass. No more.
3. **Refactor** — clean up the implementation without touching the tests. Re-run to confirm still green.

### Rules
- Never write production code before a failing test exists for it.
- Never write more production code than what the current failing test requires.
- Never refactor while tests are red.
- If a test is hard to write, that is a design signal — simplify the interface, not the test.

---

## Testing philosophy — tests are technical documentation

Tests must read like specifications, not implementation notes.

### Naming
Use `describe` + `it` in plain English that a non-developer could understand:
```ts
describe('ProjectionService', () => {
  describe('when a debt is fully paid in month 3', () => {
    it('marks month 3 as a liberation event', () => { ... });
    it('adds the freed installment amount to free_balance from month 4 onward', () => { ... });
  });
});
```

### Structure — AAA
Every test must follow **Arrange → Act → Assert**. No implicit state between tests.

### What to test
- **Unit tests** (`*.spec.ts`): pure services, especially `ProjectionService` and `SnapshotService`. These receive plain objects and return plain objects — no mocks needed.
- **Integration tests** (`*.spec.ts` with real DB): repository interactions, entity persistence, derived field computation on save.
- **e2e tests** (`test/*.e2e-spec.ts`): full HTTP request → response cycles covering the happy path and key error cases per endpoint.

### Coverage targets
- `ProjectionService` and `SnapshotService`: 100% branch coverage (they are pure functions with no I/O).
- Controllers and other services: cover happy path + all error branches.

---

## Code quality — avoid these smells

### General
- **No magic numbers or strings.** Extract to named constants.
- **No dead code.** Delete unused variables, imports, and functions immediately.
- **No commented-out code.** Use git history instead.
- **No deeply nested conditionals.** Max 2 levels. Use early returns and guard clauses.
- **No functions longer than ~20 lines.** If it's longer, it has more than one responsibility.
- **No misleading names.** Names must reflect what the thing actually does, not what you intended it to do.

### NestJS / TypeScript specific
- **No `any`.** Use proper types everywhere. If the type is unknown, model it explicitly.
- **No business logic in controllers.** Controllers receive requests, delegate to services, return responses. Nothing more.
- **No database queries in services that are supposed to be pure.** `ProjectionService` and `SnapshotService` must remain stateless — they receive data as arguments and return computed results. Never inject a repository into them.
- **No fat entities.** Entities hold state and persistence mapping only. Computation belongs in services.
- **Validate at the boundary.** All input validated via DTOs with `class-validator` decorators. Never validate inside services.
- **One module per domain.** `income`, `fixed-expense`, `debt`, `snapshot`, `projection`, `goal`. No cross-module direct imports — go through the module's exported service.

### Database
- **All schema changes via migrations.** Never use `synchronize: true` outside of local dev.
- **No raw queries unless TypeORM QueryBuilder is genuinely insufficient.** Document why if used.

---

## README requirements

The `README.md` must serve as the business rules document for the project. It must contain:

1. **What the app does** — plain English, no jargon.
2. **Entity definitions** — each entity, its fields, which are stored and which are derived.
3. **Snapshot logic** — how the monthly snapshot is computed.
4. **Projection engine** — how the N-month projection works, what a liberation event is, how amounts compound.
5. **Automation rules** — cron behavior, when `closed` flips to `true`, alert triggers.
6. **Savings goal logic** — how `current_amount` is derived, what the projection string means.

Keep the README updated as business rules evolve. If the code and the README disagree, the README is wrong — fix it.

---

## Commit discipline
- Follow **small commits** methodology — one logical change per commit. Do not bundle unrelated changes.
- Commits happen **after** the refactor step, when tests are green and code is clean.
- Commit message pattern: `type(module): brief description`
  - `type` must be one of: `feat`, `fix`, `chore`
  - `module` is the NestJS module affected: `debt`, `income`, `fixed-expense`, `snapshot`, `projection`, `goal`, `app`
  - Examples:
    - `feat(debt): close debt automatically when all installments are paid`
    - `fix(projection): exclude closed debts from liberation event calculation`
    - `chore(app): add typeorm migration for initial schema`
- Never commit a failing test unless it is explicitly a WIP spike (and the commit message says so).
