import { describe, expect, it } from 'vitest';
import type { ProjectionEvent } from '../types/api';
import { buildEventParts } from './projectionEvents';

const event = (overrides: Partial<ProjectionEvent>): ProjectionEvent => ({
  type: 'liberation',
  description: 'Descrição do backend',
  amount: 0,
  ...overrides,
});

describe('buildEventParts', () => {
  describe('when a debt is paid off and frees money', () => {
    it('names the debt, says it is paid and shows the freed amount per month', () => {
      const parts = buildEventParts(event({ type: 'liberation', debt_name: 'Carro', amount: 450 }));

      expect(parts).toEqual([
        { kind: 'name', text: 'Carro' },
        { kind: 'text', text: ' quitada — ' },
        { kind: 'amount', text: '', amount: 450 },
        { kind: 'text', text: '/mês liberados' },
      ]);
    });
  });

  describe('when a debt is paid off but frees no money', () => {
    it('only names the debt and says it is paid', () => {
      const parts = buildEventParts(event({ type: 'liberation', debt_name: 'Carro', amount: 0 }));

      expect(parts).toEqual([
        { kind: 'name', text: 'Carro' },
        { kind: 'text', text: ' quitada' },
      ]);
    });
  });

  describe('when the last installment is next month', () => {
    it('warns about the debt using its name', () => {
      const parts = buildEventParts(event({ type: 'alert', debt_name: 'Cartão', amount: 100 }));

      expect(parts).toEqual([
        { kind: 'name', text: 'Cartão' },
        { kind: 'text', text: ' — última parcela no próximo mês' },
      ]);
    });
  });

  describe('when the event has no debt name', () => {
    it('falls back to the backend description', () => {
      const parts = buildEventParts(event({ type: 'liberation', debt_name: undefined }));

      expect(parts).toEqual([{ kind: 'text', text: 'Descrição do backend' }]);
    });

    it('treats an empty debt name the same way', () => {
      const parts = buildEventParts(event({ type: 'alert', debt_name: '' }));

      expect(parts).toEqual([{ kind: 'text', text: 'Descrição do backend' }]);
    });
  });

  describe('when the event is a payroll event', () => {
    it('uses the backend description even if a debt name is present', () => {
      const parts = buildEventParts(event({ type: 'payroll', debt_name: 'Folha', description: 'Folha de março' }));

      expect(parts).toEqual([{ kind: 'text', text: 'Folha de março' }]);
    });
  });
});
