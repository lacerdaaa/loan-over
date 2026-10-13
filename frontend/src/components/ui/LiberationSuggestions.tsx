import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatCurrency';
import type { LiberationSuggestion } from '../../lib/goalPlan';
import { monthLabel } from '../../lib/monthLabel';
import { usePrivacy } from '../../lib/privacy';

interface Props {
  suggestions: LiberationSuggestion[];
  hasGoal: boolean;
}

const monthsEarlierLabel = (months: number): string => `${months} ${months === 1 ? 'mês' : 'meses'}`;

const SuggestionCard = ({ suggestion, hasGoal }: { suggestion: LiberationSuggestion; hasGoal: boolean }) => {
  const { hidden, mask } = usePrivacy();
  const amount = mask(formatCurrency(suggestion.amount));
  const name = (
    <strong className={`transition-[filter] ${hidden ? 'blur-sm select-none' : ''}`}>{suggestion.debtName}</strong>
  );

  if (!hasGoal) {
    return (
      <Link to="/goal" className="flex items-start gap-3 px-4 py-3 rounded-xl border border-base-300 hover:border-primary/40 hover:bg-primary/5 transition-colors">
        <Sparkles size={15} className="text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-base-content/80">
          Em {monthLabel(suggestion.month, suggestion.year)}, {name} quita. Crie uma meta para aproveitar os {amount}/mês liberados.
        </p>
      </Link>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-success/30 bg-success/5">
      <Sparkles size={15} className="text-success mt-0.5 shrink-0" />
      <p className="text-sm text-base-content/80">
        Em {monthLabel(suggestion.month, suggestion.year)}, {name} quita. Redirecione {amount}/mês para sua meta
        {suggestion.monthsEarlier > 0 && <> e chegue lá <strong>{monthsEarlierLabel(suggestion.monthsEarlier)} antes</strong></>}.
      </p>
    </div>
  );
};

export const LiberationSuggestions = ({ suggestions, hasGoal }: Props) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" aria-label="Sugestões de liberação">
      {suggestions.map((s) => (
        <SuggestionCard key={`${s.year}-${s.month}-${s.debtName}`} suggestion={s} hasGoal={hasGoal} />
      ))}
    </div>
  );
};
