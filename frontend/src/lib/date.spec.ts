import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addMonths, currentPeriod } from './date';

describe('addMonths', () => {
  describe('when the delta stays inside the same year', () => {
    it('moves forward by the given number of months', () => {
      const result = addMonths(3, 2026, 4);

      expect(result).toEqual({ month: 7, year: 2026 });
    });
  });

  describe('when the delta crosses a year boundary', () => {
    it('rolls December over into January of the next year', () => {
      const result = addMonths(12, 2026, 1);

      expect(result).toEqual({ month: 1, year: 2027 });
    });

    it('rolls over several years at once', () => {
      const result = addMonths(11, 2026, 26);

      expect(result).toEqual({ month: 1, year: 2029 });
    });
  });

  describe('when the delta is zero', () => {
    it('returns the same month', () => {
      expect(addMonths(5, 2026, 0)).toEqual({ month: 5, year: 2026 });
    });
  });

  describe('when the delta is negative', () => {
    it('moves backward across the year boundary', () => {
      const result = addMonths(1, 2026, -1);

      expect(result).toEqual({ month: 12, year: 2025 });
    });
  });
});

describe('currentPeriod', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the clock is in the middle of a month', () => {
    it('returns that month with a 1-based month number', () => {
      vi.setSystemTime(new Date(2026, 9, 15));

      expect(currentPeriod()).toEqual({ month: 10, year: 2026 });
    });
  });

  describe('when the clock is in January', () => {
    it('returns month 1', () => {
      vi.setSystemTime(new Date(2027, 0, 1));

      expect(currentPeriod()).toEqual({ month: 1, year: 2027 });
    });
  });
});
