import { motion } from 'framer-motion';
import { Field } from './Field';

export interface DebtFormValues {
  name: string;
  installment_amount: number;
  principal: number;
  monthly_rate: number;
  total_installments: number;
  paid_installments: number;
  start_date: string;
  hasInterest: boolean;
}

interface Props {
  values: DebtFormValues;
  onChange: (values: DebtFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  pending: boolean;
}

export const DebtForm = ({ values, onChange, onSubmit, onCancel, pending }: Props) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-3">
    <Field label="Nome">
      <input
        className="input input-bordered input-sm"
        required
        value={values.name}
        onChange={(e) => onChange({ ...values, name: e.target.value })}
      />
    </Field>

    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        className="checkbox checkbox-warning checkbox-sm"
        checked={values.hasInterest}
        onChange={(e) => onChange({ ...values, hasInterest: e.target.checked })}
      />
      <span className="text-sm">Tem juros (Tabela Price)</span>
    </label>

    {values.hasInterest ? (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Principal (R$)">
          <input
            type="number"
            step="0.01"
            className="input input-bordered input-sm"
            required
            value={values.principal || ''}
            onChange={(e) => onChange({ ...values, principal: Number(e.target.value) })}
          />
        </Field>
        <Field label="Taxa (% a.m.)">
          <input
            type="number"
            step="0.01"
            className="input input-bordered input-sm"
            required
            value={values.monthly_rate || ''}
            onChange={(e) => onChange({ ...values, monthly_rate: Number(e.target.value) })}
          />
        </Field>
      </div>
    ) : (
      <Field label="Parcela (R$)">
        <input
          type="number"
          step="0.01"
          className="input input-bordered input-sm"
          required
          value={values.installment_amount || ''}
          onChange={(e) => onChange({ ...values, installment_amount: Number(e.target.value) })}
        />
      </Field>
    )}

    <div className="grid grid-cols-2 gap-3">
      <Field label="Total de parcelas">
        <input
          type="number"
          className="input input-bordered input-sm"
          required
          value={values.total_installments || ''}
          onChange={(e) => onChange({ ...values, total_installments: Number(e.target.value) })}
        />
      </Field>
      <Field label="Já pagas">
        <input
          type="number"
          className="input input-bordered input-sm"
          value={values.paid_installments}
          onChange={(e) => onChange({ ...values, paid_installments: Number(e.target.value) })}
        />
      </Field>
    </div>

    <Field label="Data de início">
      <input
        type="date"
        className="input input-bordered input-sm"
        required
        value={values.start_date}
        onChange={(e) => onChange({ ...values, start_date: e.target.value })}
      />
    </Field>

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
        {pending ? <span className="loading loading-spinner loading-xs" /> : null}
        Salvar
      </motion.button>
    </div>
  </form>
);
