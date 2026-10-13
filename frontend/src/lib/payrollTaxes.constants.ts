/**
 * Brazilian payroll tax tables (CLT employee, monthly).
 *
 * Sources:
 * - INSS: Portaria Interministerial MPS/MF nº 13, de 09/01/2026 (Anexo II)
 *   https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal
 *   https://www.gov.br/inss/pt-br/assuntos/com-reajuste-de-3-9-teto-do-inss-chega-a-r-8-475-55-em-2026
 * - IRRF table, dependent deduction and simplified discount:
 *   https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026
 * - IRRF reduction (Lei 15.270/2025, art. 3-A of Lei 9.250/1995):
 *   https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025
 *   https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm
 */
export const TAX_TABLES_YEAR = 2026;

export interface InssBracket {
  upTo: number;
  rate: number;
}

export const INSS_BRACKETS: InssBracket[] = [
  { upTo: 1621.0, rate: 0.075 },
  { upTo: 2902.84, rate: 0.09 },
  { upTo: 4354.27, rate: 0.12 },
  { upTo: 8475.55, rate: 0.14 },
];

export const INSS_CEILING = 8475.55;

export interface IrrfBracket {
  upTo: number;
  rate: number;
  deduction: number;
}

export const IRRF_BRACKETS: IrrfBracket[] = [
  { upTo: 2428.8, rate: 0, deduction: 0 },
  { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
  { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
  { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
  { upTo: Infinity, rate: 0.275, deduction: 908.73 },
];

export const IRRF_DEPENDENT_DEDUCTION = 189.59;
export const IRRF_SIMPLIFIED_DISCOUNT = 607.2;

export const IRRF_EXEMPT_GROSS_LIMIT = 5000;
export const IRRF_MAX_REDUCTION = 312.89;
export const IRRF_REDUCTION_UPPER_LIMIT = 7350;
export const IRRF_REDUCTION_BASE = 978.62;
export const IRRF_REDUCTION_FACTOR = 0.133145;
