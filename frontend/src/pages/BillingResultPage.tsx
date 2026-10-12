import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BILLING_STATUS_KEY } from '../api/billing';
import { PageTransition } from '../components/ui/PageTransition';

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

export const BillingResultPage = ({ outcome }: { outcome: Outcome }) => {
  const qc = useQueryClient();
  const { Icon, iconClass, title, text, link } = CONTENT[outcome];

  useEffect(() => {
    if (outcome === 'success') qc.invalidateQueries({ queryKey: BILLING_STATUS_KEY });
  }, [outcome, qc]);

  return (
    <PageTransition>
      <div className="card bg-base-200 border border-base-300 p-10 flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
        <Icon size={40} className={iconClass} />
        <h1 className="text-2xl font-bold text-base-content">{title}</h1>
        <p className="text-sm text-base-content/60">{text}</p>
        <Link to={link.to} className="btn btn-primary btn-sm">{link.label}</Link>
      </div>
    </PageTransition>
  );
};
