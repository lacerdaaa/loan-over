import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DebtService } from '../debt/debt.service';
import { EmployeeService } from '../employee/employee.service';
import { FixedExpenseService } from '../fixed-expense/fixed-expense.service';
import { IncomeService } from '../income/income.service';
import { OrganizationService } from '../organization/organization.service';
import { ProjectionInput } from './projection.service';

@Injectable()
export class ProjectionInputAssembler {
  constructor(
    private readonly incomeService: IncomeService,
    private readonly debtService: DebtService,
    private readonly fixedExpenseService: FixedExpenseService,
    private readonly organizationService: OrganizationService,
    private readonly employeeService: EmployeeService,
    private readonly config: ConfigService,
  ) {}

  async assemble(
    userId: string,
    referenceMonth: number,
    referenceYear: number,
  ): Promise<ProjectionInput> {
    const businessEnabled = this.config.get<string>('FEATURE_BUSINESS') === 'true';
    const [incomes, debts, fixedExpenses, organization, employees] = await Promise.all([
      this.incomeService.findForMonth(userId, referenceMonth, referenceYear),
      this.debtService.findAll(userId),
      this.fixedExpenseService.findAll(userId),
      businessEnabled ? this.organizationService.find(userId) : Promise.resolve(null),
      businessEnabled ? this.employeeService.findAll(userId) : Promise.resolve([]),
    ]);

    return {
      incomes,
      debts,
      fixedExpenses,
      referenceMonth,
      referenceYear,
      ...(organization && {
        startingCashBalance: Number(organization.cash_balance),
        employees,
        taxRegime: organization.tax_regime,
      }),
    };
  }
}
