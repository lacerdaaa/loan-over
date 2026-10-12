import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Snowflake, Target, Zap } from 'lucide-react';
import { useState } from 'react';
import { useUpsertGoal } from '../api/goal';
import { Field } from '../components/ui/Field';
import { LiberationSuggestions } from '../components/ui/LiberationSuggestions';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';
import { MAX_PAYOFF_MONTHS } from '../lib/debt';
import { getErrorMessage } from '../lib/errorMessage';
import { formatCurrency } from '../lib/formatCurrency';
import { offsetToLabel, savedProgressPercent, type GoalStatus } from '../lib/goalPlan';
import { monthLabel } from '../lib/monthLabel';
import { usePrivacy } from '../lib/privacy';
import { useGoalPlan } from '../lib/useGoalPlan';
import type { Goal } from '../types/api';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();

const INITIAL_DEADLINE_YEAR_OFFSET = 1;

const GoalForm = ({ goal }: { goal: Goal | null }) => {
  const upsert = useUpsertGoal();
  const [form, setForm] = useState({
    target_amount: goal?.target_amount ?? 0,
    deadline_month: goal?.deadline_month ?? MONTH,
    deadline_year: goal?.deadline_year ?? YEAR + INITIAL_DEADLINE_YEAR_OFFSET,
    monthly_min: goal?.monthly_min ?? 0,
    saved_amount: goal?.saved_amount ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-base-200 border border-base-300 p-4 flex flex-col gap-3">
      <h2 className="font-semibold text-sm text-base-content">Configurar meta</h2>

      <Field label="Valor da meta (R$)">
        <input type="number" step="0.01" className="input input-sm"
          placeholder="Ex: 10.000" value={form.target_amount || ''}
          onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} />
      </Field>

      <Field label="Quanto já guardei (R$)">
        <input type="number" step="0.01" min="0" className="input input-sm"
          placeholder="Valor já separado para a meta" value={form.saved_amount || ''}
          onChange={(e) => setForm({ ...form, saved_amount: Number(e.target.value) })} />
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

      {upsert.isError && <p role="alert" className="text-xs text-error">{getErrorMessage(upsert.error)}</p>}

      <motion.button whileTap={{ scale: 0.97 }} type="submit"
        className="btn btn-primary btn-sm w-full" disabled={upsert.isPending}>
        Salvar
      </motion.button>
    </form>
  );
};

const STATUS_BADGE = (status: GoalStatus): { className: string; label: string } | null => {
  switch (status.kind) {
    case 'achieved': return { className: 'badge-success', label: 'Meta atingida' };
    case 'on_track': return { className: 'badge-success', label: 'No prazo' };
    case 'late': return {
      className: 'badge-error',
      label: `Atrasado ${status.monthsLate} ${status.monthsLate === 1 ? 'mês' : 'meses'}`,
    };
    case 'expired': return { className: 'badge-error', label: 'Prazo vencido' };
    case 'unreachable': return { className: 'badge-warning', label: 'Fora do alcance' };
  }
};

const GoalProgress = ({ goal, status, requiredMonthly, monthsLeft }: {
  goal: Goal;
  status: GoalStatus | null;
  requiredMonthly: number | null;
  monthsLeft: number;
}) => {
  const { mask } = usePrivacy();
  const percent = savedProgressPercent(goal.saved_amount, goal.target_amount);
  const badge = status ? STATUS_BADGE(status) : null;

  return (
    <div className="card bg-base-200 border border-base-300 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm text-base-content">Progresso da meta</h2>
        {badge && <span className={`badge badge-sm ${badge.className}`}>{badge.label}</span>}
      </div>
      <progress className="progress progress-success w-full" value={percent} max={100} aria-label="Progresso da meta" />
      <p className="text-xs text-base-content/60 tabular-nums">
        {mask(formatCurrency(goal.saved_amount))} de {mask(formatCurrency(goal.target_amount))} ({Math.round(percent)}%)
      </p>
      <p className="text-xs text-base-content/60 leading-relaxed">
        Prazo: <span className="font-semibold text-base-content">{monthLabel(goal.deadline_month, goal.deadline_year)}</span>
        {monthsLeft >= 0 ? ` (${monthsLeft} ${monthsLeft === 1 ? 'mês' : 'meses'})` : ' (vencido)'}
        {requiredMonthly !== null && requiredMonthly > 0 && (
          <> · aporte necessário <span className="font-semibold text-base-content">{mask(formatCurrency(requiredMonthly))}/mês</span></>
        )}
      </p>
    </div>
  );
};

const simulationWarning = (freeBal: number, targetAmount: number, goalOffset: number | null): string | null => {
  if (freeBal <= 0) {
    return 'Seu saldo livre projetado é zero ou negativo: não sobra dinheiro para poupar nem para antecipar dívidas.';
  }
  if (targetAmount > 0 && goalOffset === null) {
    return `Com o saldo livre atual, a meta não é atingida em ${MAX_PAYOFF_MONTHS} meses.`;
  }
  return null;
};

export const GoalPage = () => {
  const { goal, openDebts, baseFreeBalance: freeBal, result, suggestions, monthsLeft, status, requiredMonthly } = useGoalPlan();
  const { hidden, mask } = usePrivacy();
  const targetAmount = goal?.target_amount ?? 0;
  const monthlyMin = goal?.monthly_min ?? 0;

  const warning = simulationWarning(freeBal, targetAmount, result.goalOffset);

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
                  type="button"
                  aria-label={`Passo ${i + 1} do tutorial`}
                  aria-current={i === tutorialStep}
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
            <div className="stat-title text-xs">Saldo livre projetado</div>
            <div className="stat-value font-mono tabular-nums text-xl text-base-content">
              {mask(formatCurrency(freeBal))}
            </div>
            <div className="stat-desc">próximo mês</div>
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
                    key={d.id}
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
              </div>
            )}

            {goal && (
              <GoalProgress goal={goal} status={status} requiredMonthly={requiredMonthly} monthsLeft={monthsLeft} />
            )}

            <LiberationSuggestions suggestions={suggestions} hasGoal={goal !== null} />

            {warning && (
              <div role="alert" className="alert alert-warning alert-soft text-xs">{warning}</div>
            )}

            <GoalForm key={goal?.id ?? 'new'} goal={goal} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
