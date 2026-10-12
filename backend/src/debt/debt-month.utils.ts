const MONTH_KEY_LENGTH = 7;
const FIRST_DAY_SUFFIX = '-01';

/** First day of the month of the given date, as an ISO `YYYY-MM-01` string (UTC). */
export const monthStartKey = (value: Date | string): string => {
  const iso = typeof value === 'string' ? value : value.toISOString();
  return iso.slice(0, MONTH_KEY_LENGTH) + FIRST_DAY_SUFFIX;
};

const DATE_KEY_LENGTH = 10;

/** Calendar day of the given date, as an ISO `YYYY-MM-DD` string (UTC). */
export const dayKey = (value: Date | string): string => {
  const iso = typeof value === 'string' ? value : value.toISOString();
  return iso.slice(0, DATE_KEY_LENGTH);
};
