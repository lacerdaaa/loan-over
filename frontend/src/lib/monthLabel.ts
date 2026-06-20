const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const monthLabel = (month: number, year: number): string => {
  const name = MONTHS[month - 1] ?? '???';
  return `${name} ${year}`;
};
