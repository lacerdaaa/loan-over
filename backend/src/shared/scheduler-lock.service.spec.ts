import { DataSource, QueryRunner } from 'typeorm';
import { SchedulerLockService } from './scheduler-lock.service';

const LOCK_KEY = 42;

describe('SchedulerLockService', () => {
  let queryRunner: { connect: jest.Mock; query: jest.Mock; release: jest.Mock };
  let service: SchedulerLockService;

  const mockLockResult = (acquired: boolean): void => {
    queryRunner.query.mockImplementation((sql: string) =>
      Promise.resolve(sql.includes('pg_try_advisory_lock') ? [{ acquired }] : []),
    );
  };

  beforeEach(() => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      release: jest.fn().mockResolvedValue(undefined),
    };
    const dataSource = { createQueryRunner: () => queryRunner as unknown as QueryRunner };
    service = new SchedulerLockService(dataSource as unknown as DataSource);
  });

  describe('when no other instance holds the lock', () => {
    beforeEach(() => mockLockResult(true));

    it('runs the job and reports that it ran', async () => {
      const job = jest.fn().mockResolvedValue(undefined);

      const ran = await service.runExclusive(LOCK_KEY, job);

      expect(ran).toBe(true);
      expect(job).toHaveBeenCalledTimes(1);
    });

    it('unlocks the same key and releases the connection afterwards', async () => {
      await service.runExclusive(LOCK_KEY, jest.fn().mockResolvedValue(undefined));

      expect(queryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining('pg_advisory_unlock'),
        [LOCK_KEY],
      );
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('still unlocks and releases when the job fails, and rethrows the error', async () => {
      const job = jest.fn().mockRejectedValue(new Error('boom'));

      await expect(service.runExclusive(LOCK_KEY, job)).rejects.toThrow('boom');

      expect(queryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining('pg_advisory_unlock'),
        [LOCK_KEY],
      );
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('when another instance holds the lock', () => {
    beforeEach(() => mockLockResult(false));

    it('skips the job and reports that it did not run', async () => {
      const job = jest.fn();

      const ran = await service.runExclusive(LOCK_KEY, job);

      expect(ran).toBe(false);
      expect(job).not.toHaveBeenCalled();
    });

    it('does not try to unlock a lock it never acquired, but releases the connection', async () => {
      await service.runExclusive(LOCK_KEY, jest.fn());

      expect(queryRunner.query).not.toHaveBeenCalledWith(
        expect.stringContaining('pg_advisory_unlock'),
        expect.anything(),
      );
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });
  });
});
