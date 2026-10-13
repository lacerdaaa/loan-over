import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** Advisory lock keys, one per scheduled job. Must stay unique across jobs. */
export const SCHEDULER_LOCK_KEYS = {
  DEBT_MONTHLY_ADVANCE: 710_001,
  NOTIFICATION_MONTHLY: 710_002,
} as const;

interface TryLockRow {
  acquired: boolean;
}

/**
 * Lets only one backend instance run a scheduled job at a time.
 *
 * Raw queries are genuinely required here: advisory locks have no TypeORM
 * QueryBuilder equivalent. The lock is session-level, so lock and unlock must
 * run on the same dedicated connection (a single QueryRunner), not the pool.
 */
@Injectable()
export class SchedulerLockService {
  constructor(private readonly dataSource: DataSource) {}

  /** Runs the job if the lock is free. Returns whether the job ran. */
  async runExclusive(key: number, job: () => Promise<void>): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      const [row] = (await queryRunner.query('SELECT pg_try_advisory_lock($1) AS acquired', [
        key,
      ])) as TryLockRow[];
      if (!row?.acquired) return false;
      try {
        await job();
      } finally {
        await queryRunner.query('SELECT pg_advisory_unlock($1)', [key]);
      }
      return true;
    } finally {
      await queryRunner.release();
    }
  }
}
