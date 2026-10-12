import {
  INSS_BRACKETS,
  INSS_CEILING,
  IRRF_BRACKETS,
  IRRF_DEPENDENT_DEDUCTION,
  IRRF_EXEMPT_GROSS_LIMIT,
  IRRF_MAX_REDUCTION,
  IRRF_REDUCTION_BASE,
  IRRF_REDUCTION_FACTOR,
  IRRF_REDUCTION_UPPER_LIMIT,
  IRRF_SIMPLIFIED_DISCOUNT,
} from './payrollTaxes.constants';

export interface SalaryDeduction {
  label: string;
  amount: number;
}

const CENTS = 100;
const FLOAT_PRECISION_DIGITS = 12;
const roundCents = (value: number): number =>
  Math.round(Number((value * CENTS).toPrecision(FLOAT_PRECISION_DIGITS))) / CENTS;

export const inssEmployee = (gross: number): number => {
  const base = Math.min(Math.max(gross, 0), INSS_CEILING);
  let previousLimit = 0;
  let total = 0;
  for (const { upTo, rate } of INSS_BRACKETS) {
    total += Math.max(Math.min(base, upTo) - previousLimit, 0) * rate;
    previousLimit = upTo;
  }
  return roundCents(total);
};

const progressiveTax = (base: number): number => {
  const bracket = IRRF_BRACKETS.find(({ upTo }) => base <= upTo) ?? IRRF_BRACKETS[IRRF_BRACKETS.length - 1];
  return Math.max(base * bracket.rate - bracket.deduction, 0);
};

const reduction = (gross: number): number => {
  if (gross <= IRRF_EXEMPT_GROSS_LIMIT) return IRRF_MAX_REDUCTION;
  if (gross >= IRRF_REDUCTION_UPPER_LIMIT) return 0;
  return IRRF_REDUCTION_BASE - IRRF_REDUCTION_FACTOR * gross;
};

export const irrfMonthly = (gross: number, inss: number, dependents: number): number => {
  const legalDeductions = inss + dependents * IRRF_DEPENDENT_DEDUCTION;
  const deduction = Math.max(legalDeductions, IRRF_SIMPLIFIED_DISCOUNT);
  const tax = progressiveTax(Math.max(gross - deduction, 0));
  return roundCents(Math.max(tax - reduction(gross), 0));
};

export const salaryDeductions = (gross: number, dependents: number): SalaryDeduction[] => {
  const inss = inssEmployee(gross);
  const irrf = irrfMonthly(gross, inss, dependents);
  return [
    { label: 'INSS', amount: inss },
    { label: 'IRRF', amount: irrf },
  ].filter(({ amount }) => amount > 0);
};
