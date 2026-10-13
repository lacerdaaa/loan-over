import { describe, expect, it } from 'vitest';
import { formatAxisCurrency } from './chartFormat';

// Intl output uses a non-breaking space (U+00A0) between number and suffix; normalise it for readability.
const plain = (value: string): string => value.replace(/\s/g, ' ');

describe('formatAxisCurrency', () => {
  describe('when the value is tiny', () => {
    it('collapses to R$ 0 instead of showing a negative zero', () => {
      expect(plain(formatAxisCurrency(-0.2))).toBe('R$ 0');
      expect(plain(formatAxisCurrency(0.4))).toBe('R$ 0');
    });
  });

  describe('when the value is zero', () => {
    it('shows R$ 0', () => {
      expect(plain(formatAxisCurrency(0))).toBe('R$ 0');
    });
  });

  describe('when the value is in the thousands', () => {
    it('uses the compact Portuguese "mil" suffix', () => {
      expect(plain(formatAxisCurrency(1500))).toBe('R$ 1,5 mil');
    });
  });

  describe('when the value is negative and large', () => {
    it('keeps the minus sign', () => {
      expect(plain(formatAxisCurrency(-2000))).toBe('R$ -2 mil');
    });
  });

  describe('when the value is just above the rounding threshold', () => {
    it('keeps showing the number', () => {
      expect(plain(formatAxisCurrency(0.5))).not.toBe('R$ 0');
    });
  });
});
