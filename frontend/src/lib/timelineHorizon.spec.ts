import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  allowedHorizon,
  DEFAULT_HORIZON,
  loadHorizon,
  requiresPro,
  saveHorizon,
} from './timelineHorizon';

const STORAGE_KEY = 'loanover_timeline_horizon';

describe('requiresPro', () => {
  it('is false for horizons within the free limit', () => {
    expect(requiresPro(12)).toBe(false);
    expect(requiresPro(24)).toBe(false);
  });

  it('is true for horizons beyond the free limit', () => {
    expect(requiresPro(36)).toBe(true);
    expect(requiresPro(60)).toBe(true);
  });
});

describe('allowedHorizon', () => {
  describe('when the user is Pro', () => {
    it('keeps any chosen horizon', () => {
      expect(allowedHorizon(60, true)).toBe(60);
    });
  });

  describe('when the user is on the free plan', () => {
    it('keeps a horizon within the free limit', () => {
      expect(allowedHorizon(12, false)).toBe(12);
    });

    it('falls back to the default horizon for a Pro-only choice', () => {
      expect(allowedHorizon(60, false)).toBe(DEFAULT_HORIZON);
    });
  });
});

describe('remembered horizon', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when a valid horizon was saved', () => {
    it('loads it back', () => {
      saveHorizon(36);

      expect(loadHorizon()).toBe(36);
    });
  });

  describe('when nothing was saved', () => {
    it('loads the default horizon', () => {
      expect(loadHorizon()).toBe(DEFAULT_HORIZON);
    });
  });

  describe('when the stored value is not one of the offered horizons', () => {
    it('loads the default horizon', () => {
      store.set(STORAGE_KEY, '7');

      expect(loadHorizon()).toBe(DEFAULT_HORIZON);
    });
  });

  describe('when storage is unavailable', () => {
    beforeEach(() => {
      const failing = () => {
        throw new Error('storage blocked');
      };
      vi.stubGlobal('localStorage', { getItem: failing, setItem: failing });
    });

    it('loads the default horizon', () => {
      expect(loadHorizon()).toBe(DEFAULT_HORIZON);
    });

    it('ignores the failure when saving', () => {
      expect(() => saveHorizon(60)).not.toThrow();
    });
  });
});
