# LoanOver Pessoal — plano de varredura e features (2026-10-12)

Varredura do app (backend + frontend) focada no modo pessoal, seguida das features que estavam em
planejamento (`docs/plan.md`, copy da landing). Business fica como está.

## Decisões

- **E-mail**: [Resend](https://resend.com) via HTTP API. Sem `RESEND_API_KEY` o envio vira no-op
  com log (dev/test nunca enviam).
- **Pagamentos**: [Stripe](https://stripe.com) — Checkout (assinatura mensal) + Customer Portal +
  webhook assinado. Plano único **LoanOver Pro**.
- **Feature flag**: `FEATURE_BILLING` (backend) / `VITE_FEATURE_BILLING` (frontend), default OFF.
  Com o flag desligado **todo usuário é tratado como Pro** (nenhum paywall) e nenhuma UI de
  cobrança aparece — build flag-off continua sem regressão para quem já usa.
- **Free vs Pro** (só features novas são pagas; nada que existe hoje vira pago):
  - Free: tudo que existe + alertas por e-mail de última parcela / quitação.
  - Pro: projeção até 60 meses (free: 24), simulador de cenários ("e se eu parcelar isso?"),
    relatório mensal por e-mail.

## Fase 1 — correções (varredura)

**Backend (B1)**: vazamento multi-tenant em deduções; deduções ignoradas na criação de renda;
Price com taxa 0 (NaN); regra de quitação única (`>=`); validação cruzada de dívida; cron sem
contagem dupla e respeitando `start_date` (`last_paid_month`); limpar `monthly_min`; DTOs de
mês/ano/horizonte + `ParseUUIDPipe`; CORS por `FRONTEND_URL`; `synchronize` só em development;
deletes com escopo de usuário; descrições de eventos em pt-BR.

**Backend (B2)**: `tsc` dos specs e dívida de lint; controllers de snapshot/projeção finos
(montagem de inputs em serviço próprio); eventos estruturados (`debt_id`, `debt_name`) para o
frontend mascarar no modo privacidade; `cumulative_balance` na projeção pessoal; `saved_amount`
na meta.

**Frontend (F1)**: meta não carrega/envia strings; decimais normalizados com `Number()` nos hooks;
simulação sem dívidas; data de quitação com fuso e parcelas restantes; invalidação de
snapshot/projeção nas mutações; erros de mutação visíveis; cache limpo no logout; rota 404;
modais com scroll/acessibilidade; code splitting por rota; assets mortos.

## Fase 2 — features pessoais

1. **Meta de verdade (F2)** — progresso `saved_amount / target_amount`, aporte mensal necessário
   até o prazo, "no prazo / atrasado N meses", cards de sugestão quando uma dívida quita
   ("redirecione R$ X para sua meta").
2. **Timeline (F2)** — marcadores de liberação no gráfico, linha de saldo acumulado, eventos
   montados no frontend (privacidade), badge de alerta.
3. **Notificações por e-mail (B3 + F3)** — módulo `notification` com Resend; preferências no
   usuário; alerta de última parcela e de quitação após o cron mensal; relatório mensal (Pro);
   link de descadastro assinado.
4. **Cobrança (B4 + F3)** — módulo `billing` com Stripe; `GET /billing/status`,
   `POST /billing/checkout`, `POST /billing/portal`, `POST /billing/webhook`; entitlement
   `isPro` aplicado no horizonte da projeção e no simulador.
5. **Simulador de cenários (B4 + F3)** — `POST /projection/simulate` (puro) com dívidas
   hipotéticas e renda extra, comparado ao cenário base.
6. **Docs (B5)** — README atualizado com todas as regras novas.

## Orquestração

Orquestrador (Opus) escreve as specs; workers (Sonnet, agente `executor`) implementam com TDD.
Duas trilhas paralelas — backend e frontend — cada uma sequencial para não colidir no mesmo
arquivo. O orquestrador revisa cada entrega (testes, lint, build) antes da próxima.
