import { Injectable } from '@nestjs/common';
import { Debt } from '../debt/debt.entity';
import { Employee } from '../employee/employee.entity';
import { PayrollService } from '../employee/payroll.service';
import { isExpenseActiveForMonth } from '../fixed-expense/fixed-expense.utils';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { netAmount } from '../income/income.utils';
import { Income } from '../income/income.entity';
import { TaxRegime } from '../organization/organization.entity';
import { IncomeCategory, IncomeType, ProjectedMonth, ProjectionEvent } from '../shared/types';

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatBrl = (value: number | string): string => BRL_FORMATTER.format(Number(value));

const NOVEMBER = 11;
const DECEMBER = 12;

export interface ProjectionInput {
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  referenceMonth: number;
  referenceYear: number;
  startingCashBalance?: number;
  startingSavings?: number;
  employees?: Employee[];
  taxRegime?: TaxRegime;
}

export interface HypotheticalDebt {
  name: string;
  installment_amount: number;
  installments: number;
  start_offset: number;
}

export interface ScenarioAdjustments {
  hypothetical_debts?: HypotheticalDebt[];
  extra_monthly_income?: number;
  extra_monthly_expense?: number;
}

export interface SimulationResult {
  baseline: ProjectedMonth[];
  scenario: ProjectedMonth[];
}

interface HypotheticalMonth {
  installments: number;
  activeCount: number;
  events: ProjectionEvent[];
}

interface PayoffTarget {
  name: string;
  amount: number;
  debtId?: string;
}

@Injectable()
export class ProjectionService {
  private readonly payrollService = new PayrollService();

  simulate(
    input: ProjectionInput,
    horizonMonths: number,
    adjustments: ScenarioAdjustments,
  ): SimulationResult {
    return {
      baseline: this.project(input, horizonMonths),
      scenario: this.project(input, horizonMonths, adjustments),
    };
  }

  project(
    input: ProjectionInput,
    horizonMonths: number,
    adjustments: ScenarioAdjustments = {},
  ): ProjectedMonth[] {
    const baseIncome = this.sumFixedIncome(input.incomes) + (adjustments.extra_monthly_income ?? 0);
    const payrollCash = this.monthlyPayrollCash(input);
    let runningCash = input.startingCashBalance;
    let cumulative = input.startingSavings ?? 0;
    const months: ProjectedMonth[] = [];

    for (let offset = 0; offset < horizonMonths; offset++) {
      const projected = this.projectMonth(input, offset, baseIncome, payrollCash, adjustments);
      cumulative += projected.free_balance;
      projected.cumulative_balance = cumulative;

      if (runningCash !== undefined) {
        runningCash += projected.free_balance;
        projected.cash_balance = runningCash;
      }

      months.push(projected);
    }

    return months;
  }

  private projectMonth(
    input: ProjectionInput,
    offset: number,
    baseIncome: number,
    payrollCash: number,
    adjustments: ScenarioAdjustments,
  ): ProjectedMonth {
    const { month, year } = this.addMonths(input.referenceMonth, input.referenceYear, offset + 1);
    const monthFixed = this.sumActiveExpensesForMonth(input.fixedExpenses, month, year);
    const hypothetical = this.hypotheticalMonth(adjustments.hypothetical_debts ?? [], offset);
    const events = [...this.buildEvents(input.debts, offset), ...hypothetical.events];
    const thirteenth = this.payrollEventFor(input, month, events);
    const monthOutflow =
      monthFixed +
      this.sumActiveDebtInstallments(input.debts, offset) +
      hypothetical.installments +
      payrollCash +
      thirteenth +
      (adjustments.extra_monthly_expense ?? 0);

    return {
      month,
      year,
      free_balance: baseIncome - monthOutflow,
      events,
      active_debts: this.countActiveDebts(input.debts, offset) + hypothetical.activeCount,
      total_outflow: monthOutflow,
      cumulative_balance: 0,
    };
  }

  private hypotheticalMonth(debts: HypotheticalDebt[], offset: number): HypotheticalMonth {
    const active = debts.filter((d) => this.isHypotheticalActive(d, offset));
    return {
      installments: active.reduce((sum, d) => sum + d.installment_amount, 0),
      activeCount: active.length,
      events: debts.flatMap((d) => this.eventsForHypotheticalDebt(d, offset)),
    };
  }

  private monthlyPayrollCash(input: ProjectionInput): number {
    if (!input.employees || !input.taxRegime) return 0;
    return this.payrollService.monthlyCashCost(input.employees, input.taxRegime);
  }

  private payrollEventFor(
    input: ProjectionInput,
    month: number,
    events: ProjectionEvent[],
  ): number {
    if (!input.employees || !input.taxRegime) return 0;
    if (month !== NOVEMBER && month !== DECEMBER) return 0;

    const amount = this.payrollService.thirteenthInstallment(input.employees);
    if (amount <= 0) return 0;

    const description =
      month === NOVEMBER ? '13º salário — 1ª parcela' : '13º salário — 2ª parcela';
    events.push({ type: 'payroll', description, amount });
    return amount;
  }

  private sumFixedIncome(incomes: Income[]): number {
    return incomes
      .filter((i) => i.type === IncomeType.FIXED && i.category !== IncomeCategory.BENEFIT)
      .reduce((sum, i) => sum + netAmount(i), 0);
  }

  private sumActiveExpensesForMonth(expenses: FixedExpense[], month: number, year: number): number {
    return expenses
      .filter((e) => e.active && !e.from_benefit && isExpenseActiveForMonth(e, month, year))
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }

  private sumActiveDebtInstallments(debts: Debt[], offset: number): number {
    return debts
      .filter((d) => this.isDebtActiveAtOffset(d, offset))
      .reduce((sum, d) => sum + Number(d.installment_amount), 0);
  }

  private countActiveDebts(debts: Debt[], offset: number): number {
    return debts.filter((d) => this.isDebtActiveAtOffset(d, offset)).length;
  }

  private isDebtActiveAtOffset(debt: Debt, offset: number): boolean {
    if (debt.closed) return false;
    const remaining = debt.total_installments - debt.paid_installments;
    return offset < remaining;
  }

  private buildEvents(debts: Debt[], offset: number): ProjectionEvent[] {
    return debts.flatMap((d) => this.eventsForDebt(d, offset));
  }

  private eventsForDebt(debt: Debt, offset: number): ProjectionEvent[] {
    if (debt.closed) return [];
    const target = {
      name: debt.name,
      amount: Number(debt.installment_amount),
      debtId: debt.id,
    };
    return this.payoffEvents(target, offset, debt.total_installments - debt.paid_installments);
  }

  private isHypotheticalActive(debt: HypotheticalDebt, offset: number): boolean {
    const sinceStart = offset - debt.start_offset;
    return sinceStart >= 0 && sinceStart < debt.installments;
  }

  private eventsForHypotheticalDebt(debt: HypotheticalDebt, offset: number): ProjectionEvent[] {
    const target = { name: debt.name, amount: debt.installment_amount };
    return this.payoffEvents(target, offset - debt.start_offset, debt.installments);
  }

  private payoffEvents(
    target: PayoffTarget,
    offsetSinceStart: number,
    remaining: number,
  ): ProjectionEvent[] {
    if (offsetSinceStart === remaining) {
      return [
        {
          type: 'liberation',
          description: `${target.name} quitada — ${formatBrl(target.amount)}/mês liberados`,
          amount: target.amount,
          debt_id: target.debtId,
          debt_name: target.name,
        },
      ];
    }

    if (offsetSinceStart === remaining - 1) {
      return [
        {
          type: 'alert',
          description: `${target.name} — última parcela no próximo mês`,
          amount: target.amount,
          debt_id: target.debtId,
          debt_name: target.name,
        },
      ];
    }

    return [];
  }

  private addMonths(month: number, year: number, n: number): { month: number; year: number } {
    const date = new Date(year, month - 1 + n, 1);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }
}
