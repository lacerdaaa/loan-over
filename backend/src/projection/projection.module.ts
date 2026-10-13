import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { DebtModule } from '../debt/debt.module';
import { EmployeeModule } from '../employee/employee.module';
import { FixedExpenseModule } from '../fixed-expense/fixed-expense.module';
import { GoalModule } from '../goal/goal.module';
import { IncomeModule } from '../income/income.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { ProjectionAccessService } from './projection-access.service';
import { ProjectionInputAssembler } from './projection-input.assembler';
import { ProjectionController } from './projection.controller';
import { ProjectionService } from './projection.service';

@Module({
  imports: [
    IncomeModule,
    DebtModule,
    FixedExpenseModule,
    OrganizationModule,
    EmployeeModule,
    GoalModule,
    BillingModule,
    UserModule,
  ],
  controllers: [ProjectionController],
  providers: [ProjectionService, ProjectionInputAssembler, ProjectionAccessService],
  exports: [ProjectionService, ProjectionInputAssembler],
})
export class ProjectionModule {}
