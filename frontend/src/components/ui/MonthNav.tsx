import { addMonths, currentPeriod } from '../../lib/date';

interface Props {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export const MonthNav = ({ month, year, onChange }: Props) => {
  const current = currentPeriod();
  const isCurrent = month === current.month && year === current.year;
  const label = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const go = (delta: number) => {
    const next = addMonths(month, year, delta);
    onChange(next.month, next.year);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        aria-label="Mês anterior"
        onClick={() => go(-1)}
        className="btn btn-ghost btn-xs text-base-content/50 hover:text-base-content px-1"
      >
        ‹
      </button>
      <span className="text-sm text-base-content/60 capitalize w-32 text-center">{label}</span>
      <button
        aria-label="Próximo mês"
        onClick={() => go(1)}
        className="btn btn-ghost btn-xs text-base-content/50 hover:text-base-content px-1"
      >
        ›
      </button>
      {!isCurrent && (
        <button
          className="btn btn-ghost btn-xs text-primary px-2"
          onClick={() => onChange(current.month, current.year)}
        >
          Hoje
        </button>
      )}
    </div>
  );
};
