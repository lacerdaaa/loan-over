export const BILLING_POLL_INTERVAL_MS = 2000;
export const BILLING_POLL_MAX_ATTEMPTS = 10;

interface PollState {
  isPro: boolean;
  attempts: number;
}

export const billingPollInterval = ({ isPro, attempts }: PollState): number | false =>
  isPro || attempts >= BILLING_POLL_MAX_ATTEMPTS ? false : BILLING_POLL_INTERVAL_MS;
