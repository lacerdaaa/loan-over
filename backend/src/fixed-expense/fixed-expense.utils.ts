export function isExpenseActiveForMonth(
  expense: { valid_from_month?: number | null; valid_from_year?: number | null },
  month: number,
  year: number,
): boolean {
  if (!expense.valid_from_month || !expense.valid_from_year) return true;
  if (year > expense.valid_from_year) return true;
  if (year === expense.valid_from_year) return month >= expense.valid_from_month;
  return false;
}
