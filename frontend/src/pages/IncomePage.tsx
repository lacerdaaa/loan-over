import { motion } from 'framer-motion';
import { Coins, Plus, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { type CreateIncomePayload, useAddDeduction, useCreateIncome, useDeleteIncome, useIncome, useRemoveDeduction } from '../api/income';
import { Field } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { SalaryDeductionPreview } from '../components/ui/SalaryDeductionPreview';
import { MonthNav } from '../components/ui/MonthNav';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import { labelsFor } from '../lib/labels';
import { salaryDeductions } from '../lib/payrollTaxes';
import { usePrivacy } from '../lib/privacy';
import { useBusinessMode } from '../lib/useBusinessMode';
import type { Income, IncomeCategory, IncomeType } from '../types/api';

const now = new Date();
const CATEGORY_LABEL: Record<IncomeCategory, string> = { salary: 'Salário', rent: 'Aluguel', benefit: 'Benefício', other: 'Outro' };

const deductions = (income: Income) => income.deductions ?? [];
const netAmount = (income: Income) =>
  income.amount - deductions(income).reduce((s, d) => s + d.amount, 0);

type DeductionFormState = { incomeId: string; label: string; amount: string };

const DeductionRow = ({ income }: { income: Income }) => {
  const [showForm, setShowForm] = useState(false);
  const [deductionForm, setDeductionForm] = useState<DeductionFormState>({ incomeId: income.id, label: '', amount: '' });
  const addDeduction = useAddDeduction(income.id);
  const removeDeduction = useRemoveDeduction(income.id);
  const { mask } = usePrivacy();
  const net = netAmount(income);
  const hasDeductions = deductions(income).length > 0;
  const canCalculate = income.category === 'salary' && !hasDeductions;

  const calculateDeductions = async () => {
    for (const d of salaryDeductions(income.amount, 0)) await addDeduction.mutateAsync(d);
  };

  const submitDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    addDeduction.mutate(
      { label: deductionForm.label, amount: Number(deductionForm.amount) },
      { onSuccess: () => { setShowForm(false); setDeductionForm({ incomeId: income.id, label: '', amount: '' }); } },
    );
  };

  return (
    <div className="mt-2 space-y-1">
      {hasDeductions && (
        <div className="text-xs text-base-content/60 flex justify-between pr-1">
          <span>Bruto</span>
          <span>{mask(formatCurrency(income.amount))}</span>
        </div>
      )}
      {deductions(income).map((d) => (
        <div key={d.id} className="flex items-center justify-between text-xs text-error/80 pr-1">
          <span>– {d.label}</span>
          <div className="flex items-center gap-2">
            <span>({mask(formatCurrency(d.amount))})</span>
            <button
              aria-label="Remover desconto"
              className="btn btn-ghost btn-xs text-error h-4 min-h-0 px-1"
              onClick={() => removeDeduction.mutate(d.id)}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
      {hasDeductions && (
        <div className="flex justify-between text-xs font-semibold text-success border-t border-base-300 pt-1 pr-1">
          <span>Líquido</span>
          <span>{mask(formatCurrency(net))}</span>
        </div>
      )}
      {canCalculate && (
        <button className="text-xs text-primary/70 hover:text-primary mt-1 mr-3" disabled={addDeduction.isPending} onClick={calculateDeductions}>
          Calcular deduções
        </button>
      )}
      {showForm ? (
        <form onSubmit={submitDeduction} className="flex gap-2 mt-1">
          <input
            placeholder="Descrição"
            className="input input-xs flex-1"
            required
            value={deductionForm.label}
            onChange={(e) => setDeductionForm({ ...deductionForm, label: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor"
            className="input input-xs w-24"
            required
            value={deductionForm.amount}
            onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
          />
          <button type="submit" className="btn btn-primary btn-xs" disabled={addDeduction.isPending}>Adicionar</button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowForm(false)}><X size={14} /></button>
        </form>
      ) : (
        <button className="text-xs text-primary/70 hover:text-primary mt-1" onClick={() => setShowForm(true)}>
          + Adicionar desconto
        </button>
      )}
    </div>
  );
};

export const IncomePage = () => {
  const [tab, setTab] = useState<IncomeType>('fixed');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: '', amount: 0, type: tab, category: 'other' as IncomeCategory });
  const [calcDeductions, setCalcDeductions] = useState(false);
  const [dependents, setDependents] = useState(0);
  const { hidden, mask } = usePrivacy();
  const labels = labelsFor(useBusinessMode());

  const { data: incomes = [] } = useIncome(month, year);
  const create = useCreateIncome();
  const remove = useDeleteIncome();

  const filtered = incomes.filter((i) => i.type === tab);

  const withCalculatedDeductions = form.category === 'salary' && calcDeductions && form.amount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base: CreateIncomePayload = tab === 'fixed'
      ? { description: form.description, amount: form.amount, type: 'fixed', category: form.category, month: null, year: null }
      : { description: form.description, amount: form.amount, type: 'variable', category: form.category, month, year };
    const payload: CreateIncomePayload = withCalculatedDeductions
      ? { ...base, deductions: salaryDeductions(form.amount, dependents) }
      : base;
    create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <PageHeader
          title={labels.income}
          action={
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm gap-1.5" data-tutorial="add-income">
              <Plus size={14} /> Adicionar renda
            </motion.button>
          }
        />

        <div role="tablist" className="tabs tabs-box w-fit">
          <button role="tab" className={`tab ${tab === 'fixed' ? 'tab-active' : ''}`} onClick={() => setTab('fixed')}>Fixo</button>
          <button role="tab" className={`tab ${tab === 'variable' ? 'tab-active' : ''}`} onClick={() => setTab('variable')}>Variável</button>
        </div>

        {tab === 'variable' && (
          <MonthNav month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        )}

        <div className="flex flex-col gap-2">
          {filtered.map((income) => (
            <motion.div key={income.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card bg-base-200 border border-base-300 px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-medium text-base-content text-sm transition-[filter] ${hidden ? 'blur-sm select-none' : ''}`}>{income.description}</p>
                  {income.category === 'benefit' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/25">
                      <Coins size={11} />
                      Benefício
                    </span>
                  ) : (
                    <span className="badge badge-xs capitalize badge-outline">
                      {CATEGORY_LABEL[income.category ?? 'other']}
                    </span>
                  )}
                  {income.type === 'variable' && (
                    <span className="text-xs text-base-content/50">{income.month}/{income.year}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="font-semibold text-success text-sm">
                    {mask(formatCurrency(deductions(income).length > 0 ? netAmount(income) : income.amount))}
                  </span>
                  <motion.button whileTap={{ scale: 0.93 }} aria-label="Remover renda" className="btn btn-ghost btn-xs text-error" onClick={() => remove.mutate(income.id)}><X size={14} /></motion.button>
                </div>
              </div>
              <DeductionRow income={income} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="card bg-base-200 border border-primary/15 p-10 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet size={22} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-base-content">Nenhuma renda {tab === 'fixed' ? 'fixa' : 'variável'} registrada</p>
                <p className="text-sm text-base-content/50 mt-1 max-w-xs">
                  {tab === 'fixed'
                    ? 'Adicione salário, aluguel ou qualquer renda que entra todo mês.'
                    : 'Registre freelances, comissões ou qualquer entrada pontual.'}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm gap-1.5 mt-1">
                <Plus size={14} /> Adicionar renda
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova renda">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Descrição">
            <input className="input input-sm" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Categoria">
            <select className="select select-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as IncomeCategory })}>
              <option value="salary">Salário</option>
              <option value="rent">Aluguel</option>
              <option value="benefit">Benefício (vale-refeição, transporte, etc.)</option>
              <option value="other">Outro</option>
            </select>
          </Field>
          <Field label="Valor bruto (R$)">
            <input type="number" step="0.01" className="input input-sm" required value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </Field>
          {form.category === 'salary' && (
            <div className="flex flex-col gap-2">
              <label className="label cursor-pointer justify-start gap-2 text-xs">
                <input type="checkbox" className="checkbox checkbox-primary checkbox-xs" checked={calcDeductions} onChange={(e) => setCalcDeductions(e.target.checked)} />
                Calcular INSS e IRRF
              </label>
              {calcDeductions && (
                <>
                  <Field label="Dependentes">
                    <input type="number" min={0} step={1} className="input input-sm" value={dependents} onChange={(e) => setDependents(Math.max(0, Math.floor(Number(e.target.value))))} />
                  </Field>
                  <SalaryDeductionPreview gross={form.amount} dependents={dependents} />
                </>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setOpen(false)}>Cancelar</button>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn btn-primary btn-sm flex-1" disabled={create.isPending}>Salvar</motion.button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
};
