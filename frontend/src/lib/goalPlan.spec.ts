import { describe, expect, it } from 'vitest';
import type { Debt, ProjectedMonth, ProjectionEvent } from '../types/api';
import {
  buildLiberationSuggestions,
  evaluateGoalStatus,
  monthsEarlierWithRedirect,
  monthsUntilDeadline,
  offsetToLabel,
  requiredMonthlyContribution,
  savedProgressPercent,
  simulate,
  upcomingLiberations,
  type SimInput,
} from './goalPlan';

const TODAY = { month: 10, year: 2026 };

const debt = (overrides: Partial<Debt> = {}): Debt => ({
  id: 'd1',
  name: 'Empréstimo',
  installment_amount: 100,
  total_installments: 10,
  paid_installments: 0,
  start_date: '2026-01-01',
  closed: false,
  principal: null,
  monthly_rate: null,
  ...overrides,
});

const input = (overrides: Partial<SimInput> = {}): SimInput => ({
  openDebts: [],
  baseFreeBalance: 100,
  monthlyMin: 0,
  targetAmount: 300,
  savedAmount: 0,
  ...overrides,
});

describe('simulate', () => {
  describe('when there are no open debts', () => {
    it('is debt free from the start', () => {
      const result = simulate(input());

      expect(result.debtFreeOffset).toBe(0);
    });

    it('saves the whole free balance every month until the target is reached', () => {
      const result = simulate(input({ baseFreeBalance: 100, targetAmount: 300 }));

      expect(result.goalOffset).toBe(3);
      expect(result.postDebtMonthlyFree).toBe(100);
    });

    it('does not save anything when the free balance is negative', () => {
      const result = simulate(input({ baseFreeBalance: -50, targetAmount: 300 }));

      expect(result.goalOffset).toBeNull();
    });
  });

  describe('when the goal was already reached by what is saved', () => {
    it('reports the goal as reached at offset 0', () => {
      const result = simulate(input({ savedAmount: 300, targetAmount: 300 }));

      expect(result.goalOffset).toBe(0);
    });
  });

  describe('when there is no target amount', () => {
    it('stops as soon as the debts are gone and reports no goal offset', () => {
      const result = simulate(input({ targetAmount: 0, savedAmount: 0 }));

      expect(result.goalOffset).toBeNull();
      expect(result.debtFreeOffset).toBe(0);
    });
  });

  describe('when the free balance is zero or negative while a debt is open', () => {
    it('pays nothing extra and waits for the installments to run out', () => {
      const result = simulate(
        input({
          openDebts: [debt({ total_installments: 2 })],
          baseFreeBalance: -50,
          targetAmount: 100,
        }),
      );

      expect(result.debtFreeOffset).toBe(2);
      expect(result.debtOrder[0].snowballPayoffOffset).toBe(2);
      expect(result.debtOrder[0].monthsSaved).toBe(0);
    });

    it('adds the freed installment to the free balance once the debt ends', () => {
      const result = simulate(
        input({
          openDebts: [debt({ total_installments: 2 })],
          baseFreeBalance: -50,
          targetAmount: 100,
        }),
      );

      expect(result.postDebtMonthlyFree).toBe(50);
      expect(result.goalOffset).toBe(4);
    });
  });

  describe('when a monthly minimum is reserved for the goal', () => {
    it('sends the minimum to savings and the rest to the debts', () => {
      const result = simulate(
        input({
          openDebts: [debt({ total_installments: 10 })],
          baseFreeBalance: 100,
          monthlyMin: 30,
          targetAmount: 60,
        }),
      );

      expect(result.goalOffset).toBe(2);
    });

    it('caps the reserved amount at what is actually available', () => {
      const result = simulate(
        input({
          openDebts: [debt({ total_installments: 10 })],
          baseFreeBalance: 20,
          monthlyMin: 500,
          targetAmount: 40,
        }),
      );

      expect(result.goalOffset).toBe(2);
    });
  });

  describe('when an extra payment is bigger than the smallest debt', () => {
    const twoDebts = [
      debt({ id: 'big', name: 'Grande', total_installments: 3 }),
      debt({ id: 'small', name: 'Pequena', total_installments: 1 }),
    ];

    it('pays the smallest debt first and rolls the overpayment to the next one', () => {
      const result = simulate(input({ openDebts: twoDebts, baseFreeBalance: 250, targetAmount: 0 }));

      const [small, big] = result.debtOrder;
      expect(small.name).toBe('Pequena');
      expect(small.snowballPayoffOffset).toBe(1);
      expect(big.snowballPayoffOffset).toBe(2);
    });

    it('reports how many months the snowball saved against the natural schedule', () => {
      const result = simulate(input({ openDebts: twoDebts, baseFreeBalance: 250, targetAmount: 0 }));

      const [small, big] = result.debtOrder;
      expect(small.monthsSaved).toBe(0);
      expect(big.naturalPayoffOffset).toBe(3);
      expect(big.monthsSaved).toBe(1);
    });

    it('accumulates every freed installment in the post-debt free balance', () => {
      const result = simulate(input({ openDebts: twoDebts, baseFreeBalance: 250, targetAmount: 0 }));

      expect(result.debtFreeOffset).toBe(2);
      expect(result.postDebtMonthlyFree).toBe(450);
    });
  });

  describe('when the debts outlast the simulation horizon', () => {
    it('never becomes debt free nor reaches the goal', () => {
      const result = simulate(
        input({ openDebts: [debt({ total_installments: 300 })], baseFreeBalance: 0, targetAmount: 500 }),
      );

      expect(result.debtFreeOffset).toBeNull();
      expect(result.goalOffset).toBeNull();
    });

    it('falls back to the natural payoff offset for the unpaid debt', () => {
      const result = simulate(
        input({ openDebts: [debt({ total_installments: 300 })], baseFreeBalance: 0, targetAmount: 500 }),
      );

      expect(result.debtOrder[0].snowballPayoffOffset).toBe(300);
    });
  });

  describe('when the target is out of reach even after the debts are gone', () => {
    it('keeps the goal offset empty', () => {
      const result = simulate(input({ baseFreeBalance: 1, targetAmount: 1_000_000 }));

      expect(result.debtFreeOffset).toBe(0);
      expect(result.goalOffset).toBeNull();
    });
  });

  describe('when part of the money is redirected straight to the goal', () => {
    it('only redirects from the given offset onward', () => {
      const result = simulate(
        input({
          openDebts: [debt({ total_installments: 300 })],
          baseFreeBalance: 100,
          targetAmount: 150,
          redirect: { fromOffset: 2, amount: 100 },
        }),
      );

      expect(result.goalOffset).toBe(3);
    });
  });
});

describe('offsetToLabel', () => {
  it('shows a dash when there is no offset', () => {
    expect(offsetToLabel(null, TODAY)).toBe('—');
  });

  it('labels the month that many months after today', () => {
    expect(offsetToLabel(0, TODAY)).toBe('Out 2026');
    expect(offsetToLabel(3, TODAY)).toBe('Jan 2027');
  });
});

describe('savedProgressPercent', () => {
  it('is zero when there is no target', () => {
    expect(savedProgressPercent(100, 0)).toBe(0);
  });

  it('is the saved share of the target', () => {
    expect(savedProgressPercent(250, 1000)).toBe(25);
  });

  it('never exceeds 100 percent', () => {
    expect(savedProgressPercent(2000, 1000)).toBe(100);
  });

  it('never goes below zero', () => {
    expect(savedProgressPercent(-50, 1000)).toBe(0);
  });
});

describe('monthsUntilDeadline', () => {
  it('is zero in the deadline month', () => {
    expect(monthsUntilDeadline(10, 2026, TODAY)).toBe(0);
  });

  it('counts months across year boundaries', () => {
    expect(monthsUntilDeadline(3, 2028, TODAY)).toBe(17);
  });

  it('is negative once the deadline month has passed', () => {
    expect(monthsUntilDeadline(8, 2026, TODAY)).toBe(-2);
  });
});

describe('requiredMonthlyContribution', () => {
  it('is zero when the target is already covered', () => {
    expect(requiredMonthlyContribution(1000, 1000, 5)).toBe(0);
  });

  it('is zero when the target is covered even if the deadline passed', () => {
    expect(requiredMonthlyContribution(1000, 1500, -3)).toBe(0);
  });

  it('is null when money is missing and the deadline passed', () => {
    expect(requiredMonthlyContribution(1000, 0, -1)).toBeNull();
  });

  it('asks for the whole remainder at once in the deadline month', () => {
    expect(requiredMonthlyContribution(1000, 400, 0)).toBe(600);
  });

  it('splits the remainder over the months left', () => {
    expect(requiredMonthlyContribution(1000, 400, 6)).toBe(100);
  });
});

describe('evaluateGoalStatus', () => {
  it('is achieved when savings already cover the target', () => {
    expect(evaluateGoalStatus(1000, 1000, null, -5)).toEqual({ kind: 'achieved' });
  });

  it('is not achieved when there is no target, even with zero saved', () => {
    expect(evaluateGoalStatus(0, 0, 0, 3)).toEqual({ kind: 'on_track' });
  });

  it('is expired when the deadline passed without reaching the target', () => {
    expect(evaluateGoalStatus(1000, 100, 2, -1)).toEqual({ kind: 'expired' });
  });

  it('is unreachable when the simulation never reaches the target', () => {
    expect(evaluateGoalStatus(1000, 100, null, 6)).toEqual({ kind: 'unreachable' });
  });

  it('is on track when the target is reached by the deadline', () => {
    expect(evaluateGoalStatus(1000, 100, 6, 6)).toEqual({ kind: 'on_track' });
  });

  it('is late by the number of months past the deadline', () => {
    expect(evaluateGoalStatus(1000, 100, 9, 6)).toEqual({ kind: 'late', monthsLate: 3 });
  });
});

const event = (overrides: Partial<ProjectionEvent>): ProjectionEvent => ({
  type: 'liberation',
  description: '',
  amount: 100,
  debt_name: 'Carro',
  ...overrides,
});

const projectedMonth = (month: number, events: ProjectionEvent[] = []): ProjectedMonth => ({
  month,
  year: 2026,
  free_balance: 0,
  cumulative_balance: 0,
  events,
  active_debts: 0,
  total_outflow: 0,
});

describe('upcomingLiberations', () => {
  it('lists liberation events with their month offset in the projection', () => {
    const projection = [
      projectedMonth(10),
      projectedMonth(11, [event({ debt_name: 'Carro', amount: 450 })]),
    ];

    const result = upcomingLiberations(projection);

    expect(result).toEqual([{ debtName: 'Carro', month: 11, year: 2026, amount: 450, offset: 1 }]);
  });

  it('ignores alerts, payroll events, nameless events and events that free no money', () => {
    const projection = [
      projectedMonth(10, [
        event({ type: 'alert' }),
        event({ type: 'payroll' }),
        event({ debt_name: undefined }),
        event({ amount: 0 }),
      ]),
    ];

    expect(upcomingLiberations(projection)).toEqual([]);
  });

  it('keeps only the first few liberations', () => {
    const projection = [10, 11, 12, 1, 2].map((m) => projectedMonth(m, [event({ debt_name: `D${m}` })]));

    expect(upcomingLiberations(projection)).toHaveLength(3);
    expect(upcomingLiberations(projection, 1)).toHaveLength(1);
  });
});

describe('monthsEarlierWithRedirect', () => {
  const liberation = { debtName: 'Carro', month: 11, year: 2026, amount: 100, offset: 0 };

  describe('when redirecting the freed installment gets the goal sooner', () => {
    it('is the difference between the baseline and the redirected goal offsets', () => {
      const slowDebt = debt({ total_installments: 10 });

      const earlier = monthsEarlierWithRedirect(
        input({ openDebts: [slowDebt], baseFreeBalance: 100, targetAmount: 500 }),
        liberation,
      );

      expect(earlier).toBe(3);
    });
  });

  describe('when the goal is only reachable thanks to the redirect', () => {
    it('counts the months from the horizon limit to the redirected offset', () => {
      const endlessDebt = debt({ total_installments: 300 });

      const earlier = monthsEarlierWithRedirect(
        input({ openDebts: [endlessDebt], baseFreeBalance: 100, targetAmount: 500 }),
        liberation,
      );

      expect(earlier).toBe(116);
    });
  });

  describe('when the goal is unreachable even with the redirect', () => {
    it('makes no difference', () => {
      const endlessDebt = debt({ total_installments: 300 });

      const earlier = monthsEarlierWithRedirect(
        input({ openDebts: [endlessDebt], baseFreeBalance: 100, targetAmount: 1_000_000_000 }),
        liberation,
      );

      expect(earlier).toBe(0);
    });
  });

  describe('when the redirect would make the goal later', () => {
    it('never reports a negative number of months', () => {
      const earlier = monthsEarlierWithRedirect(input({ baseFreeBalance: 100, targetAmount: 300 }), liberation);

      expect(earlier).toBe(0);
    });
  });
});

describe('buildLiberationSuggestions', () => {
  const projection = [
    projectedMonth(10),
    projectedMonth(11, [event({ debt_name: 'Carro', amount: 100 })]),
  ];

  describe('when the user has a goal', () => {
    it('estimates how many months sooner the goal would be reached', () => {
      const suggestions = buildLiberationSuggestions(
        projection,
        input({ openDebts: [debt({ total_installments: 10 })], baseFreeBalance: 100, targetAmount: 500 }),
      );

      expect(suggestions).toEqual([
        { debtName: 'Carro', month: 11, year: 2026, amount: 100, monthsEarlier: 2 },
      ]);
    });
  });

  describe('when the user has no goal', () => {
    it('still suggests the liberation but with no months earlier', () => {
      const suggestions = buildLiberationSuggestions(projection, input({ targetAmount: 0 }));

      expect(suggestions).toEqual([
        { debtName: 'Carro', month: 11, year: 2026, amount: 100, monthsEarlier: 0 },
      ]);
    });
  });

  describe('when the projection has no liberations', () => {
    it('returns no suggestions', () => {
      expect(buildLiberationSuggestions([projectedMonth(10)], input())).toEqual([]);
    });
  });
});
