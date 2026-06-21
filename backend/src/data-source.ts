import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Debt } from './debt/debt.entity';
import { FixedExpense } from './fixed-expense/fixed-expense.entity';
import { Goal } from './goal/goal.entity';
import { IncomeDeduction } from './income/income-deduction.entity';
import { Income } from './income/income.entity';
import { OccasionalExpense } from './occasional-expense/occasional-expense.entity';
import { User } from './user/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'],
  port: Number(process.env['DB_PORT']),
  username: process.env['DB_USER'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME'],
  entities: [Income, IncomeDeduction, Debt, FixedExpense, OccasionalExpense, Goal, User],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
