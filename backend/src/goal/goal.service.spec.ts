import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoalService } from './goal.service';
import { Goal } from './goal.entity';

const makeGoal = (overrides: Partial<Goal> = {}): Goal =>
  ({ id: 'uuid-1', target_amount: 10000, deadline_month: 12, deadline_year: 2027, monthly_min: null, ...overrides }) as Goal;

describe('GoalService', () => {
  let service: GoalService;
  let repo: { find: jest.Mock; save: jest.Mock; create: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    repo = { find: jest.fn(), save: jest.fn(), create: jest.fn(), delete: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        GoalService,
        { provide: getRepositoryToken(Goal), useValue: repo },
      ],
    }).compile();

    service = module.get(GoalService);
  });

  describe('upsert', () => {
    it('creates a new goal when none exists', async () => {
      repo.find.mockResolvedValue([]);
      const dto = { target_amount: 5000, deadline_month: 6, deadline_year: 2026, monthly_min: 300 };
      const created = makeGoal(dto);
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.upsert(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.target_amount).toBe(5000);
    });

    it('persists monthly_min when provided', async () => {
      repo.find.mockResolvedValue([]);
      const dto = { target_amount: 10000, deadline_month: 12, deadline_year: 2027, monthly_min: 500 };
      const created = makeGoal(dto);
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.upsert(dto);

      expect(result.monthly_min).toBe(500);
    });

    it('updates existing goal without losing monthly_min', async () => {
      const existing = makeGoal({ monthly_min: 200 });
      repo.find.mockResolvedValue([existing]);
      const dto = { target_amount: 15000, deadline_month: 6, deadline_year: 2028, monthly_min: 400 };
      repo.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.upsert(dto);

      expect(repo.create).not.toHaveBeenCalled();
      expect(result.monthly_min).toBe(400);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when no goal exists', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.remove()).rejects.toThrow(NotFoundException);
    });
  });
});
