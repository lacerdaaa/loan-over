import { useBillingStatus, useCheckout, usePortal } from '../../api/billing';
import { PLAN_LABELS, SUBSCRIPTION_STATUS_LABELS } from '../../lib/billing';
import { ProBadge } from '../ui/ProBadge';

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('pt-BR');

export const PlanSettings = () => {
  const { data: status } = useBillingStatus();
  const checkout = useCheckout();
  const portal = usePortal();

  if (!status) return null;
  const isSubscriber = status.plan === 'pro';

  return (
    <section className="flex flex-col gap-3" aria-label="Plano">
      <h3 className="font-mono text-[11px] font-semibold text-base-content/50 uppercase tracking-[0.15em]">Plano</h3>
      <div className="flex items-center justify-between px-1 text-sm">
        <span className="text-base-content/60">Plano atual</span>
        <span className="flex items-center gap-2 font-medium">
          {PLAN_LABELS[status.plan]} {isSubscriber && <ProBadge />}
        </span>
      </div>
      {status.status && (
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="text-base-content/60">Status</span>
          <span className="font-medium">{SUBSCRIPTION_STATUS_LABELS[status.status] ?? status.status}</span>
        </div>
      )}
      {status.current_period_end && (
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="text-base-content/60">Renovação</span>
          <span className="font-medium tabular-nums">{formatDate(status.current_period_end)}</span>
        </div>
      )}
      {isSubscriber ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm border-base-300"
          disabled={portal.isPending}
          onClick={() => portal.mutate()}
        >
          Gerenciar assinatura
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={checkout.isPending}
          onClick={() => checkout.mutate()}
        >
          Assinar Pro
        </button>
      )}
    </section>
  );
};
