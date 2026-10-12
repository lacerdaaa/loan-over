import { Sparkles } from 'lucide-react';
import { useCheckout } from '../../api/billing';
import { PRO_PRICE_LABEL } from '../../lib/billing';
import { ProBadge } from './ProBadge';

interface Props {
  feature: string;
  compact?: boolean;
}

export const UpgradeCta = ({ feature, compact = false }: Props) => {
  const checkout = useCheckout();
  const button = (
    <button
      type="button"
      className={`btn btn-primary ${compact ? 'btn-xs' : 'btn-sm'}`}
      disabled={checkout.isPending}
      onClick={() => checkout.mutate()}
    >
      Assinar Pro
    </button>
  );

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-base-content/60">
        <span>{feature} faz parte do plano Pro.</span>
        {button}
      </div>
    );
  }

  return (
    <div className="card bg-base-200 border border-primary/15 p-8 flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Sparkles size={22} className="text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-base-content flex items-center justify-center gap-2">
          {feature} <ProBadge />
        </p>
        <p className="text-sm text-base-content/50 max-w-xs">
          Disponível no plano Pro por {PRO_PRICE_LABEL}.
        </p>
      </div>
      {button}
    </div>
  );
};
