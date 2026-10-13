import type { ProjectionEvent } from '../types/api';

export type EventPartKind = 'text' | 'name' | 'amount';

export interface EventPart {
  kind: EventPartKind;
  /** Plain text for `text` and `name` parts; unused for `amount` parts. */
  text: string;
  /** Raw amount for `amount` parts so the caller can format and mask it. */
  amount?: number;
}

const text = (value: string): EventPart => ({ kind: 'text', text: value });
const name = (value: string): EventPart => ({ kind: 'name', text: value });
const amount = (value: number): EventPart => ({ kind: 'amount', text: '', amount: value });

const liberationParts = (debtName: string, value: number): EventPart[] =>
  value > 0
    ? [name(debtName), text(' quitada — '), amount(value), text('/mês liberados')]
    : [name(debtName), text(' quitada')];

const alertParts = (debtName: string): EventPart[] => [
  name(debtName),
  text(' — última parcela no próximo mês'),
];

/**
 * Builds the label of a projection event from its structured fields, so the page can
 * blur the debt name and mask the amount. Falls back to the backend description when
 * the event has no debt name (e.g. payroll events or older API responses).
 */
export const buildEventParts = (event: ProjectionEvent): EventPart[] => {
  if (!event.debt_name) return [text(event.description)];
  if (event.type === 'liberation') return liberationParts(event.debt_name, event.amount);
  if (event.type === 'alert') return alertParts(event.debt_name);
  return [text(event.description)];
};
