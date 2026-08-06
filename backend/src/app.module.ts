import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
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
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const isProd = config.get<string>('NODE_ENV') === 'production';
        const base = {
          autoLoadEntities: true,
          synchronize: !isProd,
          migrations: isProd ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
          migrationsRun: isProd,
        };
        return url
          ? { type: 'postgres' as const, url, ...base }
          : {
              type: 'postgres' as const,
              host: config.get<string>('DB_HOST'),
              port: config.get<number>('DB_PORT'),
              username: config.get<string>('DB_USER'),
              password: config.get<string>('DB_PASSWORD'),
              database: config.get<string>('DB_NAME'),
              ...base,
            };
      },
    }),
    AuthModule,
    IncomeModule,
    DebtModule,
    FixedExpenseModule,
    OccasionalExpenseModule,
    SnapshotModule,
    ProjectionModule,
    GoalModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
