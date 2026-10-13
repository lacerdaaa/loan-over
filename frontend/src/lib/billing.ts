export const PRO_PRICE_LABEL = 'R$ 14,90/mês';

export const FREE_HORIZON_LIMIT = 24;

export const PLAN_LABELS = { free: 'Free', pro: 'Pro' } as const;

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  unpaid: 'Não paga',
  incomplete: 'Incompleta',
  incomplete_expired: 'Expirada',
  paused: 'Pausada',
};

export interface Entitlement {
  feature: string;
  free: string;
  pro: string;
}

export const NOT_INCLUDED = '—';
export const INCLUDED = '✓';

export const ENTITLEMENTS: Entitlement[] = [
  { feature: 'Projeção', free: 'até 24 meses', pro: 'até 60 meses' },
  { feature: 'Simulador de cenários', free: NOT_INCLUDED, pro: INCLUDED },
  { feature: 'Relatório mensal por e-mail', free: NOT_INCLUDED, pro: INCLUDED },
];
