import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BILLING_STATUS_KEY, useBillingStatus } from '../api/billing';
import { NOTIFICATION_PREFERENCES_KEY } from '../api/notifications';
import { PageTransition } from '../components/ui/PageTransition';
import { billingPollInterval } from '../lib/billingPolling';

type Outcome = 'success' | 'cancel';

const CONTENT = {
  success: {
    Icon: CheckCircle2,
    iconClass: 'text-success',
    title: 'Obrigado por assinar o Pro!',
    text: 'Sua assinatura foi confirmada. Projeção de até 60 meses, simulador e relatório mensal já estão liberados.',
    link: { to: '/dashboard', label: 'Ir para o dashboard' },
  },
  cancel: {
    Icon: XCircle,
    iconClass: 'text-warning',
    title: 'Assinatura não concluída',
    text: 'Nenhuma cobrança foi feita. Você pode assinar quando quiser pelas configurações.',
    link: { to: '/dashboard', label: 'Voltar ao dashboard' },
  },
} as const;

const PENDING_CONTENT = {
  Icon: Loader2,
  iconClass: 'text-primary animate-spin',
  title: 'Confirmando pagamento…',
  text: 'Estamos aguardando a confirmação da sua assinatura. Isso leva só alguns segundos.',
  link: { to: '/dashboard', label: 'Ir para o dashboard' },
} as const;

const TIMEOUT_CONTENT = {
  Icon: CheckCircle2,
  iconClass: 'text-warning',
  title: 'Pagamento recebido',
  text: 'A confirmação está demorando mais que o normal. Seu acesso Pro será liberado em instantes; atualize a página em breve.',
  link: { to: '/dashboard', label: 'Ir para o dashboard' },
} as const;

type View = typeof CONTENT[Outcome] | typeof PENDING_CONTENT | typeof TIMEOUT_CONTENT;

const useSuccessView = (): View => {
  const qc = useQueryClient();
  const { data } = useBillingStatus((query) =>
    billingPollInterval({ isPro: query.state.data?.is_pro ?? false, attempts: query.state.dataUpdateCount }));
  const isPro = data?.is_pro ?? false;
  const attempts = qc.getQueryState(BILLING_STATUS_KEY)?.dataUpdateCount ?? 0;

  useEffect(() => {
    if (isPro) qc.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_KEY });
  }, [isPro, qc]);

  if (isPro) return CONTENT.success;
  const gaveUp = billingPollInterval({ isPro, attempts }) === false;
  return gaveUp ? TIMEOUT_CONTENT : PENDING_CONTENT;
};

const ResultCard = ({ view: { Icon, iconClass, title, text, link } }: { view: View }) => (
  <PageTransition>
    <div className="card bg-base-200 border border-base-300 p-10 flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
      <Icon size={40} className={iconClass} />
      <h1 className="text-2xl font-bold text-base-content">{title}</h1>
      <p className="text-sm text-base-content/60">{text}</p>
      <Link to={link.to} className="btn btn-primary btn-sm">{link.label}</Link>
    </div>
  </PageTransition>
);

const SuccessResult = () => <ResultCard view={useSuccessView()} />;

export const BillingResultPage = ({ outcome }: { outcome: Outcome }) =>
  outcome === 'success' ? <SuccessResult /> : <ResultCard view={CONTENT.cancel} />;
