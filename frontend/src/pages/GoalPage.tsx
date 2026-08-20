import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Snowflake, Target, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebts } from '../api/debts';
import { useGoal, useUpsertGoal } from '../api/goal';
import { useSnapshot } from '../api/snapshot';
import { Field } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
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

  const debtsKey = JSON.stringify(openDebts);
  const result = useMemo(
    () => simulate(openDebts, freeBal, monthlyMin, targetAmount),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debtsKey is the stable stand-in for openDebts
    [debtsKey, freeBal, monthlyMin, targetAmount],
  );

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const TUTORIAL_STEPS = [
    {
      icon: <Snowflake size={22} className="text-primary" />,
      title: 'O método Snowball',
      body: 'Criado por Dave Ramsey, o Snowball é uma estratégia para quitar dívidas mais rápido usando o próprio dinheiro que você libera ao longo do tempo. A ideia central: cada dívida quitada libera uma parcela que turbina a próxima.',
    },
    {
      icon: <ArrowRight size={22} className="text-primary" />,
      title: 'Fase 1 — Quitação',
      body: 'Liste suas dívidas do menor para o maior saldo devedor. Todo mês, pague o mínimo de todas, reserve a poupança mínima que você definiu, e jogue o restante do saldo livre na menor dívida. Quando ela zerar, a parcela que era paga todo mês fica livre.',
      highlight: 'Menor saldo primeiro — não menor parcela, não maior juros.',
    },
    {
      icon: <Zap size={22} className="text-success" />,
      title: 'O efeito bola de neve',
      body: 'A parcela liberada vai inteira para a próxima dívida. Ela quita mais rápido. Libera mais dinheiro. Que vai para a próxima. O ritmo de quitação cresce cada vez mais — como uma bola de neve descendo a montanha.',
      highlight: 'O badge −3m na lista mostra quantos meses mais cedo cada dívida fecha com o Snowball vs. pagamento mínimo.',
    },
    {
      icon: <Target size={22} className="text-warning" />,
      title: 'Fase 2 — Meta',
      body: 'Quando a última dívida fecha, todo o dinheiro que ia para parcelas passa a ir para a sua meta de poupança. Você chega à fase de acumulação com um fluxo livre muito maior do que tinha no início.',
      highlight: 'Configure o valor da meta e a poupança mínima mensal no formulário abaixo.',
    },
  ] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(form);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 w-full">

        {/* Header */}
        <PageHeader
          title="Plano Financeiro"
          subtitle="Quitar dívidas primeiro, depois poupar"
          action={
            <button
              type="button"
              aria-label="Como funciona o Snowball"
              onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
              className="btn btn-ghost btn-sm btn-circle text-base-content/40 hover:text-base-content mt-1 shrink-0"
            >
              <HelpCircle size={16} />
            </button>
          }
        />

        {/* Snowball tutorial */}
        <Modal open={tutorialOpen} onClose={() => setTutorialOpen(false)} title="Como funciona o Snowball">
          <div className="flex flex-col gap-5">
            <div className="flex gap-1.5 mb-1">
              {TUTORIAL_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTutorialStep(i)}
                  className={`h-1 flex-1 rounded-full transition-colors ${i === tutorialStep ? 'bg-primary' : 'bg-primary/20'}`}
                />
              ))}
            </div>

            <motion.div
              key={tutorialStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-base-200 flex items-center justify-center">
                {TUTORIAL_STEPS[tutorialStep].icon}
              </div>
              <div>
                <p className="font-bold text-base text-base-content">{TUTORIAL_STEPS[tutorialStep].title}</p>
                <p className="text-sm leading-relaxed text-base-content/60 mt-2">{TUTORIAL_STEPS[tutorialStep].body}</p>
              </div>
              {'highlight' in TUTORIAL_STEPS[tutorialStep] && (
                <div className="bg-base-200 rounded-lg px-3 py-2.5 text-xs text-base-content/60 leading-relaxed">
                  {TUTORIAL_STEPS[tutorialStep].highlight}
                </div>
              )}
            </motion.div>

            <div className="flex items-center justify-between pt-1">
              <button
                className="btn btn-ghost btn-sm"
                disabled={tutorialStep === 0}
                onClick={() => setTutorialStep((s) => s - 1)}
              >
                ← anterior
              </button>
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                <button className="btn btn-primary btn-sm" onClick={() => setTutorialStep((s) => s + 1)}>
                  próximo →
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setTutorialOpen(false)}>
                  entendi ✓
                </button>
              )}
            </div>
          </div>
        </Modal>

        {/* Stats bar — full width */}
        <div className="stats stats-horizontal bg-base-200 border border-base-300 w-full shadow-none">
          <div className="stat">
            <div className="stat-title text-xs">Livre de dívidas</div>
            <div className="stat-value font-mono tabular-nums text-xl text-primary">
              {result.debtFreeOffset !== null ? `${result.debtFreeOffset}m` : '—'}
            </div>
            <div className="stat-desc">{offsetToLabel(result.debtFreeOffset)}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-xs">Poupança/mês</div>
            <div className="stat-value font-mono tabular-nums text-xl text-success">
              {monthlyMin > 0 ? mask(formatCurrency(monthlyMin)) : '—'}
            </div>
            <div className="stat-desc">{monthlyMin > 0 ? 'enquanto quita dívidas' : 'não definido'}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-xs">Meta atingida</div>
            <div className="stat-value font-mono tabular-nums text-xl text-warning">
              {result.goalOffset !== null ? `${result.goalOffset}m` : '—'}
            </div>
            <div className="stat-desc">{targetAmount > 0 ? offsetToLabel(result.goalOffset) : 'sem meta definida'}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-xs">Saldo livre atual</div>
            <div className="stat-value font-mono tabular-nums text-xl text-base-content">
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

              <Field label="Valor da meta (R$)">
                <input type="number" step="0.01" className="input input-sm"
                  placeholder="Ex: 10.000" value={form.target_amount || ''}
                  onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} />
              </Field>

              <Field label="Poupança mínima/mês (R$)">
                <input type="number" step="0.01" className="input input-sm"
                  placeholder="Quanto guardar enquanto quita" value={form.monthly_min || ''}
                  onChange={(e) => setForm({ ...form, monthly_min: Number(e.target.value) })} />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Prazo — mês">
                  <select className="select select-sm" value={form.deadline_month}
                    onChange={(e) => setForm({ ...form, deadline_month: Number(e.target.value) })}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('pt-BR', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Prazo — ano">
                  <input type="number" className="input input-sm" value={form.deadline_year}
                    onChange={(e) => setForm({ ...form, deadline_year: Number(e.target.value) })} />
                </Field>
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
