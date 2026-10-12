# Contrato de API — notificações, cobrança e simulador (modo pessoal)

Fonte única para os workers de backend (B3/B4) e frontend (F3). Mudança no contrato → atualizar
este arquivo no mesmo commit.

## Notificações por e-mail (Resend) — módulo `notification`

Campos novos em `users`:

| Campo | Tipo | Default | Descrição |
|---|---|---|---|
| `email_notifications` | boolean | `true` | Alertas de última parcela e de quitação |
| `monthly_report` | boolean | `false` | Relatório mensal (Pro) |

Endpoints (JWT):

- `GET /notifications/preferences` → `{ email_notifications: boolean, monthly_report: boolean }`
- `PATCH /notifications/preferences` body parcial do mesmo shape → mesmo shape.
  `monthly_report: true` sem Pro → **403** `{ message: 'Recurso disponível no plano Pro' }`.
- `POST /notifications/test` → `204`; envia um e-mail de teste para o próprio usuário
  (throttle 3/hora).

Público:

- `GET /notifications/unsubscribe?token=<jwt assinado, propósito "unsubscribe">` → desliga
  ambos os campos e redireciona para `${FRONTEND_URL}/unsubscribed`.

Agendamento (dia 1, 09:00 `America/Sao_Paulo`, depois do avanço automático de parcelas):

- **Alerta de última parcela**: dívidas abertas com exatamente 1 parcela restante.
- **Liberação**: dívidas cuja última parcela foi contada neste mês (fechadas com
  `last_paid_month` = mês corrente, após o avanço automático) → "R$ X/mês liberados" a partir do
  próximo mês.
- **Relatório mensal** (Pro + `monthly_report`): snapshot do mês + até 3 próximas liberações
  (projeção de 24 meses).
- Um e-mail por usuário agregando os itens; nada a dizer → nada enviado.
- Sem `RESEND_API_KEY` → no-op com log. Remetente em `EMAIL_FROM`. Falha de envio de um
  usuário é logada e não interrompe os demais.
- O link de cancelamento aponta para `${BACKEND_URL}/notifications/unsubscribe?token=...`
  (nova variável `BACKEND_URL`, URL pública da API; default `http://localhost:3000`). O token
  tem validade de 90 dias e **não** é aceito como token de sessão (`purpose` presente → 401).
- Token ausente na query de `/notifications/unsubscribe` → 400.

## Cobrança (Stripe) — módulo `billing`

Flag `FEATURE_BILLING` (backend) / `VITE_FEATURE_BILLING` (frontend), default OFF. Flag OFF →
todo usuário é Pro e os endpoints de checkout/portal/webhook respondem 404.

Campos novos em `users`: `plan` (`'free' | 'pro'`, default `'free'`), `stripe_customer_id`,
`stripe_subscription_id`, `subscription_status` (string do Stripe), `current_period_end`
(timestamptz) — todos nullable exceto `plan`.

- `GET /billing/status` →
  `{ billing_enabled: boolean, plan: 'free' | 'pro', is_pro: boolean, status: string | null, current_period_end: string | null }`
- `POST /billing/checkout` → `{ url: string }` (Stripe Checkout, modo assinatura,
  `STRIPE_PRICE_PRO`; success → `${FRONTEND_URL}/billing/success`, cancel →
  `${FRONTEND_URL}/billing/cancel`).
- `POST /billing/portal` → `{ url: string }` (Customer Portal; 400 se não há cliente).
- `POST /billing/webhook` (público, corpo cru, assinatura `STRIPE_WEBHOOK_SECRET`):
  `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`. Responde `200` (também para eventos desconhecidos), `400` em
  assinatura inválida, `404` com a flag desligada. Idempotente: sincroniza o estado a partir da
  assinatura Stripe. `deleted` → `plan 'free'`, `subscription_status 'canceled'`.

`is_pro` = `!billing_enabled || (plan === 'pro' && status ∈ {active, trialing})`.

### Entitlements

| Recurso | Free | Pro |
|---|---|---|
| Projeção `horizon` | ≤ 24 | ≤ 60 |
| Simulador | — | ✓ |
| Relatório mensal por e-mail | — | ✓ |

Recurso Pro sem Pro → **403** `{ message: 'Recurso disponível no plano Pro' }`
(`GET /projection?horizon=` > 24, `POST /projection/simulate`, `monthly_report: true`).

## Simulador de cenários

`POST /projection/simulate` (Pro):

```json
{
  "horizon": 24,
  "hypothetical_debts": [
    { "name": "Notebook", "installment_amount": 350, "installments": 10, "start_offset": 0 }
  ],
  "extra_monthly_income": 0,
  "extra_monthly_expense": 0
}
```

Todos opcionais (`horizon` 1..60, default 24; `hypothetical_debts` até 10 itens com
`installment_amount` > 0 e até 2 casas, `installments` inteiro 1..360 e `start_offset` inteiro
0..horizon-1 = mês projetado em que a primeira parcela entra; `extra_monthly_income` /
`extra_monthly_expense` ≥ 0). Resposta `200`; payload inválido → `400`; sem Pro → `403`. Resposta:
`{ baseline: ProjectedMonth[], scenario: ProjectedMonth[] }` — mesmo shape do `GET /projection`.
Dívidas hipotéticas geram eventos de liberação/alerta sem `debt_id` (campo ausente no JSON) e
com `debt_name` = nome informado. Só o `scenario` recebe os ajustes; o `baseline` é a projeção normal.
