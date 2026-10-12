export const toNullableNumber = (value: number | string | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);
