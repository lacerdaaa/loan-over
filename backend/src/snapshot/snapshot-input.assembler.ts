import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DebtService } from '../debt/debt.service';
import { EmployeeService } from '../employee/employee.service';
import { FixedExpenseService } from '../fixed-expense/fixed-expense.service';
import { IncomeService } from '../income/income.service';
import { OccasionalExpenseService } from '../occasional-expense/occasional-expense.service';
import { OrganizationService } from '../organization/organization.service';
import { ComputeInput } from './snapshot.service';

@Injectable()
export class SnapshotInputAssembler {
  constructor(
    private readonly incomeService: IncomeService,
    private readonly debtService: DebtService,
    private readonly fixedExpenseService: FixedExpenseService,
    private readonly occasionalExpenseService: OccasionalExpenseService,
    private readonly organizationService: OrganizationService,
    private readonly employeeService: EmployeeService,
    private readonly config: ConfigService,
  ) {}

  async assemble(userId: string, month: number, year: number): Promise<ComputeInput> {
    const businessEnabled = this.config.get<string>('FEATURE_BUSINESS') === 'true';

    const [incomes, debts, fixedExpenses, occasionalExpenses, organization, employees] =
      await Promise.all([
        this.incomeService.findForMonth(userId, month, year),
        this.debtService.findAll(userId),
        this.fixedExpenseService.findAll(userId),
        this.occasionalExpenseService.findForMonth(userId, month, year),
        businessEnabled ? this.organizationService.find(userId) : Promise.resolve(null),
        businessEnabled ? this.employeeService.findAll(userId) : Promise.resolve([]),
      ]);

    return {
      month,
      year,
      incomes,
      debts,
      fixedExpenses,
      occasionalExpenses,
      ...(organization && { employees, taxRegime: organization.tax_regime }),
    };
  }
}
