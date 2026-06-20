import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useDebts } from '../api/debts';
import { useGoal, useUpsertGoal } from '../api/goal';
import { useSnapshot } from '../api/snapshot';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import { monthLabel } from '../lib/monthLabel';
import type { Debt } from '../types/api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();

interface DebtState {
  name: string;
  installment: number;
  remainingBalance: number;
  naturalMonths: number;
  snowballMonths: number;
}

interface SimResult {
  debtFreeOffset: number | null;
  goalOffset: number | null;
  debtOrder: DebtState[];
  postDebtMonthlyFree: number;
}

function simulate(
  openDebts: Debt[],
  baseFreeBalance: number,
  monthlyMin: number,
  targetAmount: number,
): SimResult {
  const MAX = 120;

  const states = openDebts
    .map((d) => ({
      name: d.name,
      installment: Number(d.installment_amount),
      naturalRemaining: d.total_installments - d.paid_installments,
      snowballRemaining: d.total_installments - d.paid_installments,
      freed: false,
    }))
    .sort((a, b) =>
      a.naturalRemaining * a.installment - b.naturalRemaining * b.installment,
    );

  let freeBal = baseFreeBalance;
  let cumSavings = 0;
  let debtFreeOffset: number | null = null;
  let goalOffset: number | null = null;

  for (let offset = 1; offset <= MAX; offset++) {
    const allDone = states.every((d) => d.snowballRemaining <= 0);

    if (!allDone) {
      const saved = Math.min(monthlyMin, Math.max(0, freeBal));
      cumSavings += saved;
      const extra = Math.max(0, freeBal - saved);

      // Apply 1 natural month to all debts
      for (const d of states) {
        if (d.snowballRemaining > 0) d.snowballRemaining -= 1;
      }

      // Apply extra to snowball target (first with remaining > 0)
      const target = states.find((d) => d.snowballRemaining > 0);
      if (target && target.installment > 0) {
        target.snowballRemaining -= extra / target.installment;
      }

      // Free up paid debts
      for (const d of states) {
        if (d.snowballRemaining <= 0 && !d.freed) {
          d.freed = true;
          freeBal += d.installment;
        }
      }

      if (states.every((d) => d.snowballRemaining <= 0) && debtFreeOffset === null) {
        debtFreeOffset = offset;
      }
    } else {
      cumSavings += freeBal;
    }

    if (cumSavings >= targetAmount && goalOffset === null) {
      goalOffset = offset;
    }

    if (debtFreeOffset !== null && goalOffset !== null) break;
  }

  const debtOrder: DebtState[] = states.map((d) => ({
    name: d.name,
    installment: d.installment,
    remainingBalance: d.naturalRemaining * d.installment,
    naturalMonths: d.naturalRemaining,
    snowballMonths: Math.max(0, Math.round(d.naturalRemaining - (d.naturalRemaining - (d.snowballRemaining < 0 ? 0 : d.snowballRemaining)))),
  }));

  return {
    debtFreeOffset,
    goalOffset,
    debtOrder,
    postDebtMonthlyFree: freeBal,
  };
}

function addMonthsToNow(offset: number | null): string {
  if (offset === null) return '—';
  const d = new Date(YEAR, MONTH - 1 + offset, 1);
  return monthLabel(d.getMonth() + 1, d.getFullYear());
}

export const GoalPage = () => {
  const { data: goal } = useGoal();
  const { data: snapshot } = useSnapshot(MONTH, YEAR);
  const { data: allDebts = [] } = useDebts();
  const upsert = useUpsertGoal();

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
    [openDebts, freeBal, monthlyMin, targetAmount],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(form);
  };

  const hasGoal = targetAmount > 0;
  const hasDebts = openDebts.length > 0;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Plano Financeiro</h1>
          <p className="text-base-content/50 text-sm mt-0.5">Quitar dívidas primeiro, depois poupar</p>
        </div>

        {/* Stats */}
        {(hasDebts || hasGoal) && (
          <div className="stats stats-vertical sm:stats-horizontal bg-base-200 border border-base-300 w-full">
            {hasDebts && (
              <div className="stat">
                <div className="stat-title">Livre de dívidas</div>
                <div className="stat-value text-primary text-xl">
                  {result.debtFreeOffset !== null ? `${result.debtFreeOffset} meses` : '—'}
                </div>
                <div className="stat-desc">{addMonthsToNow(result.debtFreeOffset)}</div>
              </div>
            )}
            {monthlyMin > 0 && (
              <div className="stat">
                <div className="stat-title">Poupança mensal mín.</div>
                <div className="stat-value text-success text-xl">{formatCurrency(monthlyMin)}</div>
                <div className="stat-desc">enquanto quita dívidas</div>
              </div>
            )}
            {hasGoal && (
              <div className="stat">
                <div className="stat-title">Meta atingida</div>
                <div className="stat-value text-warning text-xl">
                  {result.goalOffset !== null ? `${result.goalOffset} meses` : '—'}
                </div>
                <div className="stat-desc">{addMonthsToNow(result.goalOffset)}</div>
              </div>
            )}
          </div>
        )}

        {/* Snowball debt order */}
        {hasDebts && (
          <div className="card bg-base-200 border border-base-300 p-5 flex flex-col gap-3">
            <div>
              <h2 className="font-semibold text-base-content">Ordem de quitação (Snowball)</h2>
              <p className="text-xs text-base-content/40 mt-0.5">Menor saldo restante primeiro — o valor liberado vai para a próxima</p>
            </div>
            <div className="flex flex-col gap-2">
              {result.debtOrder.map((d, i) => {
                const monthsSaved = d.naturalMonths - d.snowballMonths;
                return (
                  <motion.div
                    key={d.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2 border-b border-base-300 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-base-content/30 w-4 tabular-nums">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-base-content">{d.name}</p>
                        <p className="text-xs text-base-content/40">
                          {formatCurrency(d.remainingBalance)} restante · {formatCurrency(d.installment)}/mês
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {monthsSaved > 0 && (
                        <span className="badge badge-success badge-sm">−{monthsSaved}m</span>
                      )}
                      <span className="text-xs text-base-content/50 tabular-nums">
                        {d.snowballMonths}m
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Savings phase */}
        {hasGoal && result.debtFreeOffset !== null && (
          <div className="card bg-base-200 border border-base-300 p-5 flex flex-col gap-3">
            <h2 className="font-semibold text-base-content">Fase de poupança</h2>
            <p className="text-sm text-base-content/60">
              A partir de <strong>{addMonthsToNow(result.debtFreeOffset)}</strong>, você poupa{' '}
              <strong>{formatCurrency(result.postDebtMonthlyFree)}/mês</strong> e atinge{' '}
              <strong>{formatCurrency(targetAmount)}</strong> em{' '}
              <strong>{addMonthsToNow(result.goalOffset)}</strong>.
            </p>
            {result.goalOffset !== null && (
              <progress
                className="progress progress-primary w-full"
                value={MONTH}
                max={result.goalOffset}
              />
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card bg-base-200 border border-base-300 p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-base-content">Configurar meta</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="form-control col-span-2">
              <span className="label-text text-xs mb-1">Valor da meta (R$)</span>
              <input
                type="number" step="0.01"
                className="input input-bordered input-sm"
                placeholder="Ex: 10.000"
                value={form.target_amount || ''}
                onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })}
              />
            </label>
            <label className="form-control col-span-2">
              <span className="label-text text-xs mb-1">Poupança mínima mensal (R$)</span>
              <input
                type="number" step="0.01"
                className="input input-bordered input-sm"
                placeholder="Quanto você consegue guardar todo mês"
                value={form.monthly_min || ''}
                onChange={(e) => setForm({ ...form, monthly_min: Number(e.target.value) })}
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Prazo — mês</span>
              <select
                className="select select-bordered select-sm"
                value={form.deadline_month}
                onChange={(e) => setForm({ ...form, deadline_month: Number(e.target.value) })}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Prazo — ano</span>
              <input
                type="number"
                className="input input-bordered input-sm"
                value={form.deadline_year}
                onChange={(e) => setForm({ ...form, deadline_year: Number(e.target.value) })}
              />
            </label>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={upsert.isPending}
          >
            Salvar meta
          </motion.button>
        </form>
      </div>
    </PageTransition>
  );
};
