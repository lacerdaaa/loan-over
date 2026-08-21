import { motion } from 'framer-motion';
import { ChevronDown, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCreateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployee } from '../api/employees';
import { useOrganization } from '../api/organization';
import { Field } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import { labelsFor } from '../lib/labels';
import { employeeCost } from '../lib/payroll';
import { usePrivacy } from '../lib/privacy';
import { useBusinessMode } from '../lib/useBusinessMode';
import type { Employee, EmployeeRegime, TaxRegime } from '../types/api';

interface EmployeeFormValues {
  name: string;
  regime: EmployeeRegime;
  gross_salary: number;
  monthly_benefits: number;
  active: boolean;
}

const EMPTY_FORM: EmployeeFormValues = {
  name: '',
  regime: 'clt',
  gross_salary: 0,
  monthly_benefits: 0,
  active: true,
};

interface EmployeeFormProps {
  values: EmployeeFormValues;
  onChange: (v: EmployeeFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  pending: boolean;
  submitLabel: string;
}

const EmployeeForm = ({ values, onChange, onSubmit, onCancel, pending, submitLabel }: EmployeeFormProps) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-3">
    <Field label="Nome">
      <input
        className="input input-sm"
        required
        value={values.name}
        onChange={(e) => onChange({ ...values, name: e.target.value })}
      />
    </Field>
    <Field label="Regime">
      <select
        className="select select-sm"
        value={values.regime}
        onChange={(e) => onChange({ ...values, regime: e.target.value as EmployeeRegime })}
      >
        <option value="clt">CLT</option>
        <option value="pj">PJ</option>
      </select>
    </Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Salário bruto (R$)">
        <input
          type="number"
          step="0.01"
          min="0"
          className="input input-sm"
          required
          value={values.gross_salary || ''}
          onChange={(e) => onChange({ ...values, gross_salary: Number(e.target.value) })}
        />
      </Field>
      <Field label="Benefícios mensais (R$)">
        <input
          type="number"
          step="0.01"
          min="0"
          className="input input-sm"
          value={values.monthly_benefits || ''}
          onChange={(e) => onChange({ ...values, monthly_benefits: Number(e.target.value) })}
        />
      </Field>
    </div>
    <div className="flex gap-2 mt-2">
      <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={onCancel}>
        Cancelar
      </button>
      <motion.button
        whileTap={{ scale: 0.97 }}
        type="submit"
        className="btn btn-primary btn-sm flex-1"
        disabled={pending}
      >
        {submitLabel}
      </motion.button>
    </div>
  </form>
);

interface EmployeeCardProps {
  employee: Employee;
  taxRegime: TaxRegime;
}

const EmployeeCard = ({ employee, taxRegime }: EmployeeCardProps) => {
  const { hidden, mask } = usePrivacy();
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EmployeeFormValues>({
    name: employee.name,
    regime: employee.regime,
    gross_salary: employee.gross_salary,
    monthly_benefits: employee.monthly_benefits,
    active: employee.active,
  });

  const breakdown = employeeCost(
    Number(employee.gross_salary),
    Number(employee.monthly_benefits),
    employee.regime,
    taxRegime,
  );

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { id: employee.id, ...editForm },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const handleDelete = () => {
    remove.mutate(employee.id);
    setConfirmDelete(false);
  };

  return (
    <div className={`card bg-base-200 border border-base-300 p-4 flex flex-col gap-3 ${employee.active ? '' : 'opacity-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`font-semibold text-base-content truncate transition-[filter] ${hidden ? 'blur-sm select-none' : ''}`}>
            {employee.name}
          </span>
          <span className="badge badge-outline badge-xs uppercase">{employee.regime}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className={`badge badge-sm cursor-pointer select-none transition-colors ${employee.active ? 'badge-success' : 'badge-ghost text-base-content/40'}`}
            onClick={() => update.mutate({ id: employee.id, active: !employee.active })}
          >
            {employee.active ? 'Ativo' : 'Inativo'}
          </button>
          <motion.button
            whileTap={{ scale: 0.93 }}
            aria-label="Editar funcionário"
            className="btn btn-ghost btn-xs text-base-content/50"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={13} />
          </motion.button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button className="btn btn-error btn-xs" onClick={handleDelete}>Confirmar</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setConfirmDelete(false)}>Cancelar</button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.93 }}
              aria-label="Excluir funcionário"
              className="btn btn-ghost btn-xs text-error"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-base-content/50">Salário bruto</span>
        <span className="text-xs tabular-nums text-base-content/60">{mask(formatCurrency(Number(employee.gross_salary)))}</span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-base-content/70">Custo real mensal</span>
        <span className="font-mono text-base font-semibold tabular-nums text-base-content" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {mask(formatCurrency(breakdown.total))}
        </span>
      </div>

      <div className="collapse collapse-arrow bg-base-300/50 rounded-lg">
        <input
          type="checkbox"
          checked={expanded}
          onChange={() => setExpanded((v) => !v)}
          aria-label="Expandir breakdown"
        />
        <div className="collapse-title text-xs font-medium text-base-content/50 py-2 px-3 min-h-0 flex items-center gap-1">
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          Composição do custo
        </div>
        <div className="collapse-content px-3 pb-3">
          <div className="flex flex-col gap-1.5 pt-1">
            <BreakdownRow label="Salário bruto" value={breakdown.salary} mask={mask} />
            {breakdown.fgts !== undefined && (
              <BreakdownRow label="FGTS (8%)" value={breakdown.fgts} mask={mask} />
            )}
            {breakdown.thirteenth !== undefined && (
              <BreakdownRow label="Provisão 13º (1/12)" value={breakdown.thirteenth} mask={mask} />
            )}
            {breakdown.vacation !== undefined && (
              <BreakdownRow label="Provisão férias + ⅓ (4/3 ÷ 12)" value={breakdown.vacation} mask={mask} />
            )}
            {breakdown.inss !== undefined && breakdown.inss > 0 && (
              <BreakdownRow label="INSS patronal + RAT/terceiros" value={breakdown.inss} mask={mask} />
            )}
            {breakdown.benefits > 0 && (
              <BreakdownRow label="Benefícios mensais" value={breakdown.benefits} mask={mask} />
            )}
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar pessoa">
        <EmployeeForm
          values={editForm}
          onChange={setEditForm}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          pending={update.isPending}
          submitLabel="Salvar"
        />
      </Modal>
    </div>
  );
};

const BreakdownRow = ({
  label,
  value,
  mask,
}: {
  label: string;
  value: number;
  mask: (v: string) => string;
}) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-xs text-base-content/50">{label}</span>
    <span className="text-xs tabular-nums text-base-content/70">{mask(formatCurrency(value))}</span>
  </div>
);

export const PeoplePage = () => {
  const isBusinessMode = useBusinessMode();
  const { data: employees = [] } = useEmployees();
  const { data: organization } = useOrganization();
  const create = useCreateEmployee();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const labels = labelsFor(true);

  if (!isBusinessMode) return <Navigate to="/dashboard" replace />;

  const taxRegime: TaxRegime = organization?.tax_regime ?? 'simples';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => {
        setOpen(false);
        setForm(EMPTY_FORM);
      },
    });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <PageHeader
          title={labels.people}
          subtitle={`${employees.filter((e) => e.active).length} ativo(s)`}
          action={
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpen(true)}
              className="btn btn-primary btn-sm gap-1.5"
            >
              <Plus size={14} /> Adicionar pessoa
            </motion.button>
          }
        />

        {employees.length === 0 ? (
          <div className="card bg-base-200 border border-primary/15 p-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users size={22} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base-content">Nenhuma pessoa cadastrada</p>
              <p className="text-sm text-base-content/50 mt-1 max-w-xs">
                Cadastre colaboradores para calcular o custo real da folha e projetar o 13º.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpen(true)}
              className="btn btn-primary btn-sm gap-1.5 mt-1"
            >
              <Plus size={14} /> Adicionar primeira pessoa
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <EmployeeCard key={emp.id} employee={emp} taxRegime={taxRegime} />
            ))}
          </div>
        )}

        <p className="text-xs text-base-content/40">
          Encargos estimados — confirme os valores com seu contador.
        </p>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova pessoa">
        <EmployeeForm
          values={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          pending={create.isPending}
          submitLabel="Adicionar"
        />
      </Modal>
    </PageTransition>
  );
};
