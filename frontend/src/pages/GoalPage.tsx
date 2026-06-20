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
const MAX_MONTHS = 120;

interface DebtResult {
  name: string;
  installment: number;
  remainingBalance: number;
  naturalMonths: number;
  snowballPayoffOffset: number;
  monthsSaved: number;
}

interface SimResult {
  debtFreeOffset: number | null;
  goalOffset: number | null;
  debtOrder: DebtResult[];
  postDebtMonthlyFree: number;
}

function simulate(openDebts: Debt[], baseFreeBalance: number, monthlyMin: number, targetAmount: number): SimResult {
  const states = openDebts
    .map((d) => ({
      name: d.name,
      installment: Number(d.installment_amount),
      naturalRemaining: d.total_installments - d.paid_installments,
      snowballRemaining: d.total_installments - d.paid_installments,
      freed: false,
      snowballPayoffOffset: 0,
    }))
    .sort((a, b) => a.naturalRemaining * a.installment - b.naturalRemaining * b.installment);

  let freeBal = baseFreeBalance;
  let cumSavings = 0;
  let debtFreeOffset: number | null = null;
  let goalOffset: number | null = null;

  for (let offset = 1; offset <= MAX_MONTHS; offset++) {
    const allDone = states.every((d) => d.snowballRemaining <= 0);

    if (!allDone) {
      const saved = Math.min(monthlyMin, Math.max(0, freeBal));
      cumSavings += saved;
      const extra = Math.max(0, freeBal - saved);

      for (const d of states) {
        if (d.snowballRemaining > 0) d.snowballRemaining -= 1;
      }

      const target = states.find((d) => d.snowballRemaining > 0);
      if (target && target.installment > 0) {
        target.snowballRemaining -= extra / target.installment;
      }

      for (const d of states) {
        if (d.snowballRemaining <= 0 && !d.freed) {
          d.freed = true;
          d.snowballPayoffOffset = offset;
          freeBal += d.installment;
        }
      }

      if (states.every((d) => d.snowballRemaining <= 0) && debtFreeOffset === null) {
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
    remainingBalance: d.naturalRemaining * d.installment,
    naturalMonths: d.naturalRemaining,
    snowballPayoffOffset: d.snowballPayoffOffset || d.naturalRemaining,
    monthsSaved: Math.max(0, d.naturalRemaining - (d.snowballPayoffOffset || d.naturalRemaining)),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(form);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 w-full max-w-2xl">

        <div>
          <h1 className="text-2xl font-bold text-base-content">Plano Financeiro</h1>
          <p className="text-base-content/50 text-sm mt-0.5">Quitar dívidas primeiro, depois poupar</p>
        </div>

        {/* Stats */}
        <div className="stats stats-horizontal bg-base-200 border border-base-300 w-full shadow-none">
          <div className="stat px-4 py-3">
            <div className="stat-title text-xs">Livre de dívidas</div>
            <div className="stat-value text-lg text-primary">
              {result.debtFreeOffset !== null ? `${result.debtFreeOffset}m` : '—'}
            </div>
            <div className="stat-desc">{offsetToLabel(result.debtFreeOffset)}</div>
          </div>
          <div className="stat px-4 py-3">
            <div className="stat-title text-xs">Poupança/mês</div>
            <div className="stat-value text-lg text-success">
              {monthlyMin > 0 ? formatCurrency(monthlyMin) : '—'}
            </div>
            <div className="stat-desc">{monthlyMin > 0 ? 'enquanto quita' : 'não definido'}</div>
          </div>
          <div className="stat px-4 py-3">
            <div className="stat-title text-xs">Meta atingida</div>
            <div className="stat-value text-lg text-warning">
              {result.goalOffset !== null ? `${result.goalOffset}m` : '—'}
            </div>
            <div className="stat-desc">{targetAmount > 0 ? offsetToLabel(result.goalOffset) : 'sem meta'}</div>
          </div>
        </div>

        {/* Snowball order */}
        {openDebts.length > 0 && (
          <div className="card bg-base-200 border border-base-300">
            <div className="px-4 pt-4 pb-2">
              <h2 className="font-semibold text-sm text-base-content">Ordem Snowball</h2>
              <p className="text-xs text-base-content/40">Menor saldo primeiro — valor liberado vai para a próxima</p>
            </div>
            <div className="divide-y divide-base-300">
              {result.debtOrder.map((d, i) => (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span className="text-xs text-base-content/25 w-4 shrink-0 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-content truncate">{d.name}</p>
                    <p className="text-xs text-base-content/40 tabular-nums">
                      {formatCurrency(d.remainingBalance)} · {formatCurrency(d.installment)}/mês
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {d.monthsSaved > 0 && (
                      <span className="badge badge-success badge-xs">−{d.monthsSaved}m</span>
                    )}
                    <span className="text-xs text-base-content/40 tabular-nums w-8 text-right">
                      {offsetToLabel(d.snowballPayoffOffset)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Savings phase summary */}
        {targetAmount > 0 && result.debtFreeOffset !== null && (
          <div className="card bg-base-200 border border-base-300 px-4 py-3 flex flex-col gap-2">
            <p className="text-sm text-base-content/70">
              A partir de <span className="font-semibold text-base-content">{offsetToLabel(result.debtFreeOffset)}</span>,
              poupando <span className="font-semibold text-base-content">{formatCurrency(result.postDebtMonthlyFree)}/mês</span> →
              meta de <span className="font-semibold text-base-content">{formatCurrency(targetAmount)}</span> em{' '}
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
          <div className="grid grid-cols-2 gap-3">
            <label className="form-control col-span-2 sm:col-span-1">
              <span className="label-text text-xs mb-1">Valor da meta (R$)</span>
              <input type="number" step="0.01" className="input input-bordered input-sm"
                placeholder="Ex: 10.000" value={form.target_amount || ''}
                onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} />
            </label>
            <label className="form-control col-span-2 sm:col-span-1">
              <span className="label-text text-xs mb-1">Poupança mínima/mês (R$)</span>
              <input type="number" step="0.01" className="input input-bordered input-sm"
                placeholder="Quanto guardar todo mês" value={form.monthly_min || ''}
                onChange={(e) => setForm({ ...form, monthly_min: Number(e.target.value) })} />
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Prazo — mês</span>
              <select className="select select-bordered select-sm" value={form.deadline_month}
                onChange={(e) => setForm({ ...form, deadline_month: Number(e.target.value) })}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Prazo — ano</span>
              <input type="number" className="input input-bordered input-sm" value={form.deadline_year}
                onChange={(e) => setForm({ ...form, deadline_year: Number(e.target.value) })} />
            </label>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn btn-primary btn-sm" disabled={upsert.isPending}>
            Salvar
          </motion.button>
        </form>
      </div>
    </PageTransition>
  );
};
