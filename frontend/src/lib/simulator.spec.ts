import { describe, expect, it } from 'vitest';
import type { ProjectedMonth, ProjectionEvent } from '../types/api';
import {
  buildChartRows,
  buildSimulationPayload,
  compareScenarios,
  emptyDebtDraft,
  monthInputToOffset,
  nextMonthOf,
  offsetToMonthInput,
  toMonthInput,
  type DebtDraft,
  type SimulationForm,
} from './simulator';

const NOW = new Date(2026, 9, 12); // 12 Oct 2026 -> next month is Nov 2026

const month = (
  m: number,
  freeBalance: number,
  cumulative: number,
  events: ProjectionEvent[] = [],
): ProjectedMonth => ({
  month: m,
  year: 2026,
  free_balance: freeBalance,
  cumulative_balance: cumulative,
  events,
  active_debts: 0,
  total_outflow: 0,
});

const liberation: ProjectionEvent = { type: 'liberation', description: '', amount: 100 };
const alert: ProjectionEvent = { type: 'alert', description: '', amount: 100 };

const draft = (overrides: Partial<DebtDraft> = {}): DebtDraft => ({
  name: 'Notebook',
  installment_amount: '200',
  installments: '6',
  start_month: '2026-11',
  ...overrides,
});

const form = (overrides: Partial<SimulationForm> = {}): SimulationForm => ({
  horizon: 12,
  debts: [draft()],
  extra_income: '',
  extra_expense: '',
  ...overrides,
});

describe('nextMonthOf', () => {
  it('is the month after the given date', () => {
    expect(nextMonthOf(NOW)).toEqual({ month: 11, year: 2026 });
  });

  it('rolls December into January of the next year', () => {
    expect(nextMonthOf(new Date(2026, 11, 20))).toEqual({ month: 1, year: 2027 });
  });
});

describe('toMonthInput', () => {
  it('pads single-digit months to the YYYY-MM picker format', () => {
    expect(toMonthInput(3, 2027)).toBe('2027-03');
    expect(toMonthInput(12, 2027)).toBe('2027-12');
  });
});

describe('monthInputToOffset', () => {
  it('is zero for next month', () => {
    expect(monthInputToOffset('2026-11', NOW)).toBe(0);
  });

  it('counts months across years', () => {
    expect(monthInputToOffset('2027-02', NOW)).toBe(3);
  });

  it('is negative for months before next month', () => {
    expect(monthInputToOffset('2026-10', NOW)).toBe(-1);
  });

  it('is null when the value is malformed', () => {
    expect(monthInputToOffset('', NOW)).toBeNull();
    expect(monthInputToOffset('2026-1', NOW)).toBeNull();
    expect(monthInputToOffset('nov/2026', NOW)).toBeNull();
  });
});

describe('offsetToMonthInput', () => {
  it('turns an offset from next month back into a picker value', () => {
    expect(offsetToMonthInput(0, NOW)).toBe('2026-11');
    expect(offsetToMonthInput(3, NOW)).toBe('2027-02');
  });

  it('is the inverse of monthInputToOffset', () => {
    expect(monthInputToOffset(offsetToMonthInput(14, NOW), NOW)).toBe(14);
  });
});

describe('emptyDebtDraft', () => {
  it('starts blank and scheduled for next month', () => {
    expect(emptyDebtDraft(NOW)).toEqual({
      name: '',
      installment_amount: '',
      installments: '',
      start_month: '2026-11',
    });
  });
});

describe('buildSimulationPayload', () => {
  describe('when every field is valid', () => {
    it('builds the request body with numeric values and a start offset', () => {
      const payload = buildSimulationPayload(
        form({ extra_income: '300', extra_expense: '50', debts: [draft({ name: '  Notebook  ', start_month: '2027-01' })] }),
        NOW,
      );

      expect(payload).toEqual({
        horizon: 12,
        hypothetical_debts: [{ name: 'Notebook', installment_amount: 200, installments: 6, start_offset: 2 }],
        extra_monthly_income: 300,
        extra_monthly_expense: 50,
      });
    });
  });

  describe('when the extra fields are left empty', () => {
    it('treats them as zero', () => {
      const payload = buildSimulationPayload(form(), NOW);

      expect(payload?.extra_monthly_income).toBe(0);
      expect(payload?.extra_monthly_expense).toBe(0);
    });
  });

  describe('when there are no hypothetical debts', () => {
    it('still builds a payload', () => {
      const payload = buildSimulationPayload(form({ debts: [], extra_income: '100' }), NOW);

      expect(payload?.hypothetical_debts).toEqual([]);
    });
  });

  describe('when a debt is invalid', () => {
    it.each([
      ['the name is blank', { name: '   ' }],
      ['the installment amount is zero', { installment_amount: '0' }],
      ['the installment amount is not a number', { installment_amount: 'abc' }],
      ['the installment count is fractional', { installments: '2.5' }],
      ['the installment count is zero', { installments: '0' }],
      ['the start month is malformed', { start_month: 'nov' }],
      ['the start month is before next month', { start_month: '2026-10' }],
      ['the start month is beyond the horizon', { start_month: '2027-11' }],
    ])('rejects the form when %s', (_label, override) => {
      const payload = buildSimulationPayload(form({ debts: [draft(override)] }), NOW);

      expect(payload).toBeNull();
    });
  });

  describe('when the extra amounts are invalid', () => {
    it('rejects a negative extra income', () => {
      expect(buildSimulationPayload(form({ extra_income: '-1' }), NOW)).toBeNull();
    });

    it('rejects a negative extra expense', () => {
      expect(buildSimulationPayload(form({ extra_expense: '-1' }), NOW)).toBeNull();
    });

    it('rejects text in the extra fields', () => {
      expect(buildSimulationPayload(form({ extra_income: 'abc' }), NOW)).toBeNull();
      expect(buildSimulationPayload(form({ extra_expense: 'abc' }), NOW)).toBeNull();
    });
  });
});

describe('compareScenarios', () => {
  describe('when both scenarios have payoffs', () => {
    const baseline = [month(11, 100, 100), month(12, 100, 200, [liberation]), month(1, 100, 300)];
    const scenario = [month(11, 50, 50), month(12, -20, 30), month(1, 40, 70, [liberation])];

    it('reports the lowest free balance month of the scenario', () => {
      expect(compareScenarios(baseline, scenario).lowestFreeBalance).toEqual(scenario[1]);
    });

    it('reports the first month with a negative free balance', () => {
      expect(compareScenarios(baseline, scenario).firstNegativeMonth).toBe(scenario[1]);
    });

    it('reports the cumulative difference at the end of the horizon', () => {
      expect(compareScenarios(baseline, scenario).cumulativeDifference).toBe(70 - 300);
    });

    it('reports how many months the last payoff moved (positive means later)', () => {
      expect(compareScenarios(baseline, scenario).payoffShiftMonths).toBe(1);
    });
  });

  describe('when the scenario never goes negative', () => {
    it('has no first negative month', () => {
      const result = compareScenarios([month(11, 10, 10)], [month(11, 10, 10)]);

      expect(result.firstNegativeMonth).toBeNull();
    });
  });

  describe('when a side has no liberation event', () => {
    it('cannot compare payoffs', () => {
      const withPayoff = [month(11, 1, 1, [liberation])];
      const withAlertOnly = [month(11, 1, 1, [alert])];

      expect(compareScenarios(withPayoff, withAlertOnly).payoffShiftMonths).toBeNull();
      expect(compareScenarios(withAlertOnly, withPayoff).payoffShiftMonths).toBeNull();
    });
  });

  describe('when both projections are empty', () => {
    it('returns neutral results', () => {
      expect(compareScenarios([], [])).toEqual({
        lowestFreeBalance: null,
        firstNegativeMonth: null,
        cumulativeDifference: 0,
        payoffShiftMonths: null,
      });
    });
  });
});

describe('buildChartRows', () => {
  it('pairs each scenario month with the baseline month at the same position', () => {
    const rows = buildChartRows([month(11, 100, 100)], [month(11, 60, 60)]);

    expect(rows).toEqual([
      {
        month: 11,
        year: 2026,
        baseline_free: 100,
        scenario_free: 60,
        baseline_cumulative: 100,
        scenario_cumulative: 60,
      },
    ]);
  });

  it('uses zero for baseline months that do not exist', () => {
    const rows = buildChartRows([], [month(11, 60, 60)]);

    expect(rows[0].baseline_free).toBe(0);
    expect(rows[0].baseline_cumulative).toBe(0);
  });
});
