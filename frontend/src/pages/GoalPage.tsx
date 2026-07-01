import { motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { useDebts } from '../api/debts';
import { useGoal, useUpsertGoal } from '../api/goal';
import { useSnapshot } from '../api/snapshot';
import { PageTransition } from '../components/ui/PageTransition';
import { remainingBalance } from '../lib/debt';
import { formatCurrency } from '../lib/formatCurrency';
import { monthLabel } from '../lib/monthLabel';
import { usePrivacy } from '../lib/privacy';
import type { Debt } from '../types/api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();
const MAX_MONTHS = 120;

interface DebtResult {
  name: string;
  installment: number;
  trueRemainingBalance: number;
  snowballPayoffOffset: number;
  naturalPayoffOffset: number;
  monthsSaved: number;
}

interface SimResult {
  debtFreeOffset: number | null;
  goalOffset: number | null;
  debtOrder: DebtResult[];
  postDebtMonthlyFree: number;
}

interface DebtState {
  name: string;
  installment: number;
  rate: number;
  balance: number;
  initialBalance: number;
  freed: boolean;
  snowballPayoffOffset: number;
  naturalPayoffOffset: number;
}

function naturalPayoffOffset(installment: number, rate: number, balance: number): number {
  if (rate === 0) return Math.ceil(balance / installment);
  let b = balance;
  let months = 0;
  while (b > 0.01 && months < MAX_MONTHS) {
    b -= installment - b * rate;
    months++;
  }
  return months;
}

function simulate(openDebts: Debt[], baseFreeBalance: number, monthlyMin: number, targetAmount: number): SimResult {
  const states: DebtState[] = openDebts
    .map((d) => {
      const installment = Number(d.installment_amount);
      const rate = Number(d.monthly_rate ?? 0);
      const balance = remainingBalance(d);
      return {
        name: d.name,
        installment,
        rate,
        balance,
        initialBalance: balance,
        freed: false,
        snowballPayoffOffset: 0,
        naturalPayoffOffset: naturalPayoffOffset(installment, rate, balance),
      };
    })
    .sort((a, b) => a.balance - b.balance);

  let freeBal = baseFreeBalance;
  let cumSavings = 0;
  let debtFreeOffset: number | null = null;
  let goalOffset: number | null = null;

  for (let offset = 1; offset <= MAX_MONTHS; offset++) {
    const allDone = states.every((d) => d.freed);

    if (!allDone) {
      const saved = Math.min(monthlyMin, Math.max(0, freeBal));
      cumSavings += saved;
      const extra = Math.max(0, freeBal - saved);

      // Apply extra to the smallest active debt
      const target = states.find((d) => !d.freed);
      if (target) target.balance -= extra;

      // Advance every active debt by one installment (with amortization)
      for (const d of states) {
        if (d.freed) continue;
        const interest = d.rate > 0 ? d.balance * d.rate : 0;
        d.balance -= d.installment - interest;

        if (d.balance <= 0.01 && !d.freed) {
          d.freed = true;
          d.snowballPayoffOffset = offset;
          freeBal += d.installment;
        }
      }

      if (states.every((d) => d.freed) && debtFreeOffset === null) {
        debtFreeOffset = offset;
      }
    } else {
      cumSavings += freeBal;
    }

    if (targetAmount > 0 && cumSavings >= targetAmount && goalOffset === null) {
      goalOffset = offset;
    }

    if (debtFreeOffset !== null && (goalOffset !== null || targetAmount === 0)) break;
  }

  const debtOrder: DebtResult[] = states.map((d) => ({
    name: d.name,
    installment: d.installment,
    trueRemainingBalance: d.initialBalance,
    snowballPayoffOffset: d.snowballPayoffOffset || d.naturalPayoffOffset,
    naturalPayoffOffset: d.naturalPayoffOffset,
    monthsSaved: Math.max(0, d.naturalPayoffOffset - (d.snowballPayoffOffset || d.naturalPayoffOffset)),
  }));

  return { debtFreeOffset, goalOffset, debtOrder, postDebtMonthlyFree: freeBal };
}

function offsetToLabel(offset: number | null): string {
  if (offset === null) return '—';
  const d = new Date(YEAR, MONTH - 1 + offset, 1);
  return monthLabel(d.getMonth() + 1, d.getFullYear());
}

export const GoalPage = () => {
  const { data: goal } = useGoal();
  const { data: snapshot } = useSnapshot(MONTH, YEAR);
  const { data: allDebts = [] } = useDebts();
  const upsert = useUpsertGoal();

  const { hidden, mask } = usePrivacy();
  const openDebts = allDebts.filter((d) => !d.closed);
  const freeBal = snapshot?.free_balance ?? 0;
  const targetAmount = goal?.target_amount ?? 0;
  const monthlyMin = goal?.monthly_min ?? 0;

  const [form, setForm] = useState({
    target_amount: goal?.target_amount ?? 0,
    deadline_month: goal?.deadline_month ?? MONTH,
    deadline_year: goal?.deadline_year ?? YEAR + 1,
    monthly_min: goal?.monthly_min ?? 0,
  });

  const result = useMemo(
    () => simulate(openDebts, freeBal, monthlyMin, targetAmount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(openDebts), freeBal, monthlyMin, targetAmount],
  );

  const infoRef = useRef<HTMLDialogElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(form);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 w-full">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Plano Financeiro</h1>
            <p className="text-base-content/50 text-sm mt-0.5">Quitar dívidas primeiro, depois poupar</p>
          </div>
          <button
            type="button"
            onClick={() => infoRef.current?.showModal()}
            className="btn btn-ghost btn-sm btn-circle text-base-content/40 hover:text-base-content mt-1 shrink-0"
          >
            ?
          </button>
        </div>

        {/* Methodology modal */}
        <dialog ref={infoRef} className="modal">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Como funciona o Snowball</h3>
            <div className="flex flex-col gap-4 text-sm text-base-content/80">
              <div className="flex gap-3">
                <span className="badge badge-primary badge-sm mt-0.5 shrink-0">1</span>
                <p>
                  <strong className="text-base-content">Fase de quitação</strong> — enquanto houver dívidas abertas,
                  você reserva a <strong>poupança mínima</strong> que definiu e joga o restante do saldo livre
                  na dívida com o <strong>menor saldo devedor</strong> primeiro.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="badge badge-primary badge-sm mt-0.5 shrink-0">2</span>
                <p>
                  Quando essa dívida é quitada, a parcela que era paga todo mês fica <strong>livre</strong> e
                  passa a turbinar a próxima da lista. O efeito cresce como uma bola de neve.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="badge badge-success badge-sm mt-0.5 shrink-0">3</span>
                <p>
                  <strong className="text-base-content">Fase de poupança</strong> — com todas as dívidas zeradas,
                  o saldo inteiro vai para a sua meta. Sem dívida, todo o dinheiro é seu.
                </p>
              </div>
              <div className="bg-base-200 rounded-lg p-3 text-xs text-base-content/60">
                O badge <span className="badge badge-success badge-xs">−3m</span> indica quantos meses mais cedo
                essa dívida será quitada em comparação com o pagamento mínimo normal.
              </div>
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-sm btn-ghost">Fechar</button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop"><button>fechar</button></form>
        </dialog>

        {/* Stats bar — full width */}
        <div className="stats stats-horizontal bg-base-200 border border-base-300 w-full shadow-none">
          <div className="stat">
            <div className="stat-title text-xs">Livre de dívidas</div>
            <div className="stat-value text-xl text-primary">
              {result.debtFreeOffset !== null ? `${result.debtFreeOffset}m` : '—'}
            </div>
            <div className="stat-desc">{offsetToLabel(result.debtFreeOffset)}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-xs">Poupança/mês</div>
            <div className="stat-value text-xl text-success">
              {monthlyMin > 0 ? mask(formatCurrency(monthlyMin)) : '—'}
            </div>
            <div className="stat-desc">{monthlyMin > 0 ? 'enquanto quita dívidas' : 'não definido'}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-xs">Meta atingida</div>
            <div className="stat-value text-xl text-warning">
              {result.goalOffset !== null ? `${result.goalOffset}m` : '—'}
            </div>
            <div className="stat-desc">{targetAmount > 0 ? offsetToLabel(result.goalOffset) : 'sem meta definida'}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-xs">Saldo livre atual</div>
            <div className="stat-value text-xl text-base-content">
              {mask(formatCurrency(freeBal))}
            </div>
            <div className="stat-desc">este mês</div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* LEFT — Snowball list */}
          {openDebts.length > 0 && (
            <div className="card bg-base-200 border border-base-300">
              <div className="px-5 pt-4 pb-2">
                <h2 className="font-semibold text-sm text-base-content">Ordem Snowball</h2>
                <p className="text-xs text-base-content/40 mt-0.5">
                  Menor saldo primeiro — parcela liberada vai para a próxima dívida
                </p>
              </div>
              <div className="divide-y divide-base-300">
                {result.debtOrder.map((d, i) => (
                  <motion.div
                    key={d.name}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="text-xs text-base-content/25 w-5 shrink-0 tabular-nums text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-base-content truncate transition-[filter] ${hidden ? 'blur-sm select-none' : ''}`}>{d.name}</p>
                      <p className="text-xs text-base-content/40 tabular-nums mt-0.5">
                        {mask(formatCurrency(d.trueRemainingBalance))} restante · {mask(formatCurrency(d.installment))}/mês
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-xs font-medium text-base-content tabular-nums">
                        {offsetToLabel(d.snowballPayoffOffset)}
                      </span>
                      {d.monthsSaved > 0 && (
                        <div className="tooltip tooltip-left" data-tip={`${d.monthsSaved} meses mais rápido com o Snowball`}>
                          <span className="badge badge-success badge-xs cursor-default">−{d.monthsSaved}m</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* RIGHT — Form + savings summary */}
          <div className="flex flex-col gap-4">

            {/* Savings phase */}
            {targetAmount > 0 && result.debtFreeOffset !== null && (
              <div className="card bg-base-200 border border-base-300 p-4 flex flex-col gap-3">
                <h2 className="font-semibold text-sm text-base-content">Fase de poupança</h2>
                <p className="text-xs text-base-content/60 leading-relaxed">
                  A partir de{' '}
                  <span className="font-semibold text-base-content">{offsetToLabel(result.debtFreeOffset)}</span>,
                  poupando{' '}
                  <span className="font-semibold text-base-content">{mask(formatCurrency(result.postDebtMonthlyFree))}/mês</span>
                  {' '}→ meta em{' '}
                  <span className="font-semibold text-success">{offsetToLabel(result.goalOffset)}</span>
                </p>
                {result.goalOffset !== null && (
                  <progress className="progress progress-success w-full" value={1} max={result.goalOffset} />
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="card bg-base-200 border border-base-300 p-4 flex flex-col gap-3">
              <h2 className="font-semibold text-sm text-base-content">Configurar meta</h2>

              <label className="form-control">
                <span className="label-text text-xs mb-1">Valor da meta (R$)</span>
                <input type="number" step="0.01" className="input input-bordered input-sm"
                  placeholder="Ex: 10.000" value={form.target_amount || ''}
                  onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} />
              </label>

              <label className="form-control">
                <span className="label-text text-xs mb-1">Poupança mínima/mês (R$)</span>
                <input type="number" step="0.01" className="input input-bordered input-sm"
                  placeholder="Quanto guardar enquanto quita" value={form.monthly_min || ''}
                  onChange={(e) => setForm({ ...form, monthly_min: Number(e.target.value) })} />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="form-control">
                  <span className="label-text text-xs mb-1">Prazo — mês</span>
                  <select className="select select-bordered select-sm" value={form.deadline_month}
                    onChange={(e) => setForm({ ...form, deadline_month: Number(e.target.value) })}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('pt-BR', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-control">
                  <span className="label-text text-xs mb-1">Prazo — ano</span>
                  <input type="number" className="input input-bordered input-sm" value={form.deadline_year}
                    onChange={(e) => setForm({ ...form, deadline_year: Number(e.target.value) })} />
                </label>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} type="submit"
                className="btn btn-primary btn-sm w-full" disabled={upsert.isPending}>
                Salvar
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
