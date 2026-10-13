import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { usePro } from '../api/billing';
import { useSimulate, type SimulationResult } from '../api/simulator';
import { Field } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';
import { SimulatorChart } from '../components/ui/SimulatorChart';
import { UpgradeCta } from '../components/ui/UpgradeCta';
import { formatCurrency } from '../lib/formatCurrency';
import { monthLabel } from '../lib/monthLabel';
import { usePrivacy } from '../lib/privacy';
import {
  buildChartRows,
  buildSimulationPayload,
  compareScenarios,
  emptyDebtDraft,
  MAX_HYPOTHETICAL_DEBTS,
  offsetToMonthInput,
  type DebtDraft,
  type SimulationForm,
} from '../lib/simulator';
import { DEFAULT_HORIZON, HORIZON_OPTIONS } from '../lib/timelineHorizon';

const SIMULATOR_FEATURE = 'O simulador de cenários';
const MONEY_STEP = '0.01';

const DebtRow = ({ draft, horizon, now, onChange, onRemove }: {
  draft: DebtDraft;
  horizon: number;
  now: Date;
  onChange: (patch: Partial<DebtDraft>) => void;
  onRemove: () => void;
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1.3fr_auto] gap-3 items-end">
    <div className="col-span-2 sm:col-span-1">
      <Field label="Nome">
        <input className="input input-sm w-full" value={draft.name} placeholder="Ex.: Notebook"
          onChange={(e) => onChange({ name: e.target.value })} />
      </Field>
    </div>
    <Field label="Parcela (R$)">
      <input type="number" min="0" step={MONEY_STEP} className="input input-sm w-full" value={draft.installment_amount}
        onChange={(e) => onChange({ installment_amount: e.target.value })} />
    </Field>
    <Field label="Nº de parcelas">
      <input type="number" min="1" step="1" className="input input-sm w-full" value={draft.installments}
        onChange={(e) => onChange({ installments: e.target.value })} />
    </Field>
    <Field label="Primeira parcela em">
      <input type="month" className="input input-sm w-full" value={draft.start_month}
        min={offsetToMonthInput(0, now)} max={offsetToMonthInput(horizon - 1, now)}
        onChange={(e) => onChange({ start_month: e.target.value })} />
    </Field>
    <button type="button" className="btn btn-ghost btn-sm btn-square text-error" aria-label="Remover dívida" onClick={onRemove}>
      <Trash2 size={14} />
    </button>
  </div>
);

const Summary = ({ result }: { result: SimulationResult }) => {
  const { mask } = usePrivacy();
  const { lowestFreeBalance, firstNegativeMonth, cumulativeDifference, payoffShiftMonths } =
    compareScenarios(result.baseline, result.scenario);
  const diffClass = cumulativeDifference >= 0 ? 'text-success' : 'text-error';
  const sign = cumulativeDifference > 0 ? '+' : '';

  return (
    <div className="flex flex-col gap-4">
      {firstNegativeMonth && (
        <div role="alert" className="alert alert-warning text-sm">
          <AlertTriangle size={15} className="shrink-0" />
          <span>
            O saldo livre fica negativo a partir de <strong>{monthLabel(firstNegativeMonth.month, firstNegativeMonth.year)}</strong>{' '}
            ({mask(formatCurrency(firstNegativeMonth.free_balance))}).
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-200 border border-base-300 p-4">
          <p className="font-mono text-[11px] text-base-content/50 uppercase tracking-[0.15em]">Menor saldo livre mensal</p>
          <p className="font-mono text-xl font-bold tabular-nums mt-1">
            {lowestFreeBalance ? mask(formatCurrency(lowestFreeBalance.free_balance)) : '—'}
          </p>
          {lowestFreeBalance && (
            <p className="text-xs text-base-content/50">{monthLabel(lowestFreeBalance.month, lowestFreeBalance.year)}</p>
          )}
        </div>
        <div className="card bg-base-200 border border-base-300 p-4">
          <p className="font-mono text-[11px] text-base-content/50 uppercase tracking-[0.15em]">Saldo acumulado no fim</p>
          <p className={`font-mono text-xl font-bold tabular-nums mt-1 ${diffClass}`}>
            {sign}{mask(formatCurrency(cumulativeDifference))}
          </p>
          <p className="text-xs text-base-content/50">em relação ao cenário atual</p>
        </div>
        <div className="card bg-base-200 border border-base-300 p-4">
          <p className="font-mono text-[11px] text-base-content/50 uppercase tracking-[0.15em]">Última dívida quitada</p>
          <p className="font-mono text-xl font-bold tabular-nums mt-1">{describePayoffShift(payoffShiftMonths)}</p>
          <p className="text-xs text-base-content/50">em relação ao cenário atual</p>
        </div>
      </div>
    </div>
  );
};

const describePayoffShift = (shift: number | null): string => {
  if (shift === null) return '—';
  if (shift === 0) return 'Sem mudança';
  const unit = Math.abs(shift) === 1 ? 'mês' : 'meses';
  return `${Math.abs(shift)} ${unit} ${shift > 0 ? 'depois' : 'antes'}`;
};

const SimulatorContent = () => {
  const now = new Date();
  const [form, setForm] = useState<SimulationForm>({
    horizon: DEFAULT_HORIZON,
    debts: [],
    extra_income: '',
    extra_expense: '',
  });
  const simulate = useSimulate();
  const payload = buildSimulationPayload(form, now);

  const updateDebt = (index: number, patch: Partial<DebtDraft>) =>
    setForm((f) => ({ ...f, debts: f.debts.map((d, i) => (i === index ? { ...d, ...patch } : d)) }));
  const removeDebt = (index: number) =>
    setForm((f) => ({ ...f, debts: f.debts.filter((_, i) => i !== index) }));
  const addDebt = () => setForm((f) => ({ ...f, debts: [...f.debts, emptyDebtDraft(new Date())] }));

  return (
    <>
      <form
        className="card bg-base-200 border border-primary/15 p-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (payload) simulate.mutate(payload);
        }}
      >
        <h2 className="font-mono text-[11px] font-semibold text-base-content/50 uppercase tracking-[0.15em]">Dívidas hipotéticas</h2>
        {form.debts.map((draft, i) => (
          <DebtRow key={i} draft={draft} horizon={form.horizon} now={now}
            onChange={(patch) => updateDebt(i, patch)} onRemove={() => removeDebt(i)} />
        ))}
        <button type="button" className="btn btn-ghost btn-sm border-base-300 self-start gap-2"
          disabled={form.debts.length >= MAX_HYPOTHETICAL_DEBTS} onClick={addDebt}>
          <Plus size={14} /> Adicionar dívida ({form.debts.length}/{MAX_HYPOTHETICAL_DEBTS})
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Renda extra mensal (R$)">
            <input type="number" min="0" step={MONEY_STEP} className="input input-sm w-full" value={form.extra_income}
              onChange={(e) => setForm((f) => ({ ...f, extra_income: e.target.value }))} />
          </Field>
          <Field label="Gasto extra mensal (R$)">
            <input type="number" min="0" step={MONEY_STEP} className="input input-sm w-full" value={form.extra_expense}
              onChange={(e) => setForm((f) => ({ ...f, extra_expense: e.target.value }))} />
          </Field>
          <Field label="Horizonte">
            <select className="select select-sm w-full" value={form.horizon}
              onChange={(e) => setForm((f) => ({ ...f, horizon: Number(e.target.value) }))}>
              {HORIZON_OPTIONS.map((h) => <option key={h} value={h}>{h} meses</option>)}
            </select>
          </Field>
        </div>

        <button type="submit" className="btn btn-primary btn-sm self-start" disabled={!payload || simulate.isPending}>
          Simular
        </button>
      </form>

      {simulate.data && (
        <>
          <Summary result={simulate.data} />
          <div className="card bg-base-200 border border-primary/15 p-5">
            <SimulatorChart rows={buildChartRows(simulate.data.baseline, simulate.data.scenario)} />
          </div>
        </>
      )}
    </>
  );
};

export const SimulatorPage = () => {
  const isPro = usePro();
  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <PageHeader title="Simulador" subtitle="E se eu parcelar isso? Compare o cenário atual com uma compra hipotética" />
        {isPro ? <SimulatorContent /> : <UpgradeCta feature={SIMULATOR_FEATURE} />}
      </div>
    </PageTransition>
  );
};
