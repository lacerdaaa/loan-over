import { formatCurrency } from '../../lib/formatCurrency';
import { salaryDeductions } from '../../lib/payrollTaxes';
import { TAX_TABLES_YEAR } from '../../lib/payrollTaxes.constants';
import { usePrivacy } from '../../lib/privacy';

export const SalaryDisclaimer = () => (
  <p className="text-xs text-base-content/50">
    Estimativa com as tabelas de {TAX_TABLES_YEAR}; confira no seu holerite.
  </p>
);

export const SalaryDeductionPreview = ({ gross, dependents }: { gross: number; dependents: number }) => {
  const { mask } = usePrivacy();
  const deductions = salaryDeductions(gross, dependents);
  const net = gross - deductions.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="rounded-lg bg-base-200 border border-base-300 px-3 py-2 space-y-1">
      {deductions.map((d) => (
        <div key={d.label} className="flex justify-between text-xs text-error/80">
          <span>– {d.label}</span>
          <span>({mask(formatCurrency(d.amount))})</span>
        </div>
      ))}
      <div className="flex justify-between text-xs font-semibold text-success border-t border-base-300 pt-1">
        <span>Líquido estimado</span>
        <span>{mask(formatCurrency(net))}</span>
      </div>
      <SalaryDisclaimer />
    </div>
  );
};
