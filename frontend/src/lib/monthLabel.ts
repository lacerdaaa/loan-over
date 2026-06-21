const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const monthLabel = (month: number, year: number): string => {
  const name = MONTHS[month - 1] ?? '???';
  return `${name} ${year}`;
};
