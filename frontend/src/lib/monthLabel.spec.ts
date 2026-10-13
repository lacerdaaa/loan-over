import { describe, expect, it } from 'vitest';
import { monthLabel } from './monthLabel';

describe('monthLabel', () => {
  describe('when the month is valid', () => {
    it('writes the abbreviated Portuguese month name followed by the year', () => {
      const label = monthLabel(1, 2027);

      expect(label).toBe('Jan 2027');
    });

    it('labels December as the last month of the year', () => {
      const label = monthLabel(12, 2026);

      expect(label).toBe('Dez 2026');
    });
  });

  describe('when the month is out of range', () => {
    it('shows a placeholder instead of the month name', () => {
      expect(monthLabel(0, 2026)).toBe('??? 2026');
      expect(monthLabel(13, 2026)).toBe('??? 2026');
    });
  });
});
