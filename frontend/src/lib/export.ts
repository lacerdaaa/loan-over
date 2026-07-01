import { remainingBalance } from './debt';
import { formatCurrency } from './formatCurrency';
import { monthLabel } from './monthLabel';
import type { Debt, FixedExpense, Goal, Income, MonthlySnapshot, OccasionalExpense } from '../types/api';

export interface ExportData {
  month: number;
  year: number;
  incomes: Income[];
  debts: Debt[];
  fixedExpenses: FixedExpense[];
  occasionalExpenses: OccasionalExpense[];
  goal: Goal | null;
  snapshot: MonthlySnapshot | null;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildJsonExport(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

const netIncome = (income: Income): number =>
  Number(income.amount) - (income.deductions ?? []).reduce((s, d) => s + Number(d.amount), 0);

export function buildTextExport(data: ExportData): string {
  const { month, year, incomes, debts, fixedExpenses, occasionalExpenses, goal, snapshot } = data;
  const lines: string[] = [];

  lines.push(`# Situação Financeira — ${monthLabel(month, year)}`);
  lines.push('');

  // Income
  const nonBenefitIncomes = incomes.filter((i) => i.category !== 'benefit');
  const benefitIncomes = incomes.filter((i) => i.category === 'benefit');
  const totalNet = nonBenefitIncomes.reduce((s, i) => s + netIncome(i), 0);

  lines.push(`## Renda (${formatCurrency(totalNet)}/mês)`);
  for (const i of nonBenefitIncomes) {
    const net = netIncome(i);
    const deductions = i.deductions ?? [];
    lines.push(`- ${i.description} — ${formatCurrency(net)}/mês`);
    if (deductions.length > 0) {
      lines.push(`  (bruto: ${formatCurrency(i.amount)} | descontos: ${deductions.map((d) => `${d.label} ${formatCurrency(d.amount)}`).join(', ')})`);
    }
  }
  if (benefitIncomes.length > 0) {
    const totalBenefit = benefitIncomes.reduce((s, i) => s + netIncome(i), 0);
    lines.push(`- Benefícios (vale-refeição, etc.) — ${formatCurrency(totalBenefit)}/mês [uso restrito]`);
  }
  lines.push('');

  // Fixed expenses
  const activeExpenses = fixedExpenses.filter((e) => e.active && !e.from_benefit);
  const totalFixed = activeExpenses.reduce((s, e) => s + Number(e.amount), 0);

  lines.push(`## Gastos Fixos (${formatCurrency(totalFixed)}/mês)`);
  for (const e of fixedExpenses.filter((e) => !e.from_benefit)) {
    const status = e.active ? '' : ' [inativo]';
    lines.push(`- ${e.name} — ${formatCurrency(e.amount)}/mês, vence dia ${e.due_day}${status}`);
  }
  if (fixedExpenses.some((e) => e.from_benefit)) {
    lines.push('Pagos com benefício (não deduzem do saldo livre):');
    for (const e of fixedExpenses.filter((e) => e.from_benefit)) {
      lines.push(`- ${e.name} — ${formatCurrency(e.amount)}/mês`);
    }
  }
  lines.push('');

  // Debts
  const openDebts = debts.filter((d) => !d.closed);
  const closedDebts = debts.filter((d) => d.closed);
  const totalDebtInstallments = openDebts.reduce((s, d) => s + Number(d.installment_amount), 0);
  const totalDebtBalance = openDebts.reduce((s, d) => s + remainingBalance(d), 0);

  lines.push(`## Dívidas em aberto (${openDebts.length} dívidas | parcelas: ${formatCurrency(totalDebtInstallments)}/mês | saldo devedor total: ${formatCurrency(totalDebtBalance)})`);
  openDebts.forEach((d, i) => {
    const remaining = d.total_installments - d.paid_installments;
    lines.push(`${i + 1}. ${d.name} — ${formatCurrency(d.installment_amount)}/mês, ${remaining} parcelas restantes`);
    if (d.monthly_rate) {
      const pv = remainingBalance(d);
      const face = remaining * Number(d.installment_amount);
      lines.push(`   Taxa: ${(Number(d.monthly_rate) * 100).toFixed(2)}% a.m. | Valor para quitar hoje: ${formatCurrency(pv)} (face: ${formatCurrency(face)})`);
    } else {
      lines.push(`   Saldo devedor: ${formatCurrency(remainingBalance(d))}`);
    }
  });
  if (closedDebts.length > 0) {
    lines.push(`Dívidas quitadas: ${closedDebts.map((d) => d.name).join(', ')}`);
  }
  lines.push('');

  // Occasional expenses
  if (occasionalExpenses.length > 0) {
    const totalOccasional = occasionalExpenses.filter((e) => !e.from_benefit).reduce((s, e) => s + Number(e.amount), 0);
    lines.push(`## Gastos Ocasionais — ${monthLabel(month, year)} (total: ${formatCurrency(totalOccasional)})`);
    for (const e of occasionalExpenses) {
      const tag = e.from_benefit ? ' [benefício]' : '';
      lines.push(`- ${e.description} — ${formatCurrency(e.amount)}${tag}`);
    }
    lines.push('');
  }

  // Free balance
  const freeBalance = snapshot?.free_balance ?? (totalNet - totalFixed - totalDebtInstallments);
  lines.push(`## Saldo livre atual`);
  lines.push(`${formatCurrency(freeBalance)}/mês`);
  lines.push('');

  // Goal
  if (goal) {
    lines.push(`## Meta financeira`);
    lines.push(`Valor-alvo: ${formatCurrency(goal.target_amount)} — prazo: ${monthLabel(goal.deadline_month, goal.deadline_year)}`);
    if (goal.monthly_min) {
      lines.push(`Poupança mínima enquanto quita dívidas: ${formatCurrency(goal.monthly_min)}/mês`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`Exportado em ${new Date().toLocaleString('pt-BR')} pelo Loan Over.`);

  return lines.join('\n');
}
