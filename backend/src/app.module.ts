import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebtModule } from './debt/debt.module';
import { FixedExpenseModule } from './fixed-expense/fixed-expense.module';
import { GoalModule } from './goal/goal.module';
import { IncomeModule } from './income/income.module';
import { OccasionalExpenseModule } from './occasional-expense/occasional-expense.module';
import { ProjectionModule } from './projection/projection.module';
import { SnapshotModule } from './snapshot/snapshot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    IncomeModule,
    DebtModule,
    FixedExpenseModule,
    OccasionalExpenseModule,
    SnapshotModule,
    ProjectionModule,
    GoalModule,
  ],
})
export class AppModule {}
