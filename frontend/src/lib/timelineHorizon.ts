export const HORIZON_OPTIONS = [12, 24, 36, 60] as const;
export type Horizon = (typeof HORIZON_OPTIONS)[number];

export const DEFAULT_HORIZON: Horizon = 24;
const STORAGE_KEY = 'loanover_timeline_horizon';

const isHorizon = (value: number): value is Horizon =>
  (HORIZON_OPTIONS as readonly number[]).includes(value);

export const loadHorizon = (): Horizon => {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return isHorizon(stored) ? stored : DEFAULT_HORIZON;
  } catch {
    return DEFAULT_HORIZON;
  }
};

export const saveHorizon = (horizon: Horizon): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(horizon));
  } catch {
    // Storage unavailable (private mode): the choice simply is not remembered.
  }
};
