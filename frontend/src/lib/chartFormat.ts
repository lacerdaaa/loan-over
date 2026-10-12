const compactFormatter = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const ROUNDS_TO_ZERO_BELOW = 0.5;

/** Short axis label like "R$ 1,5 mil"; tiny values collapse to "R$ 0" instead of "R$ -0". */
export const formatAxisCurrency = (value: number): string => {
  const safe = Math.abs(value) < ROUNDS_TO_ZERO_BELOW ? 0 : value;
  return `R$ ${compactFormatter.format(safe)}`;
};
