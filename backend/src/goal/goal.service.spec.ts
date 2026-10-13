import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoalService } from './goal.service';
import { Goal } from './goal.entity';

const USER_ID = 'user-uuid';

const makeGoal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: 'uuid-1',
    target_amount: 10000,
    deadline_month: 12,
    deadline_year: 2027,
    monthly_min: null,
    saved_amount: 0,
    ...overrides,
  }) as Goal;

describe('GoalService', () => {
  let service: GoalService;
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn(), delete: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [GoalService, { provide: getRepositoryToken(Goal), useValue: repo }],
    }).compile();

    service = module.get(GoalService);
  });

  describe('upsert', () => {
    it('creates a new goal when none exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const dto = { target_amount: 5000, deadline_month: 6, deadline_year: 2026, monthly_min: 300 };
      const created = makeGoal(dto);
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.upsert(USER_ID, dto);

      expect(repo.create).toHaveBeenCalledWith({ user: { id: USER_ID }, ...dto });
      expect(result.target_amount).toBe(5000);
    });

    it('persists monthly_min when provided', async () => {
      repo.findOne.mockResolvedValue(null);
      const dto = {
        target_amount: 10000,
        deadline_month: 12,
        deadline_year: 2027,
        monthly_min: 500,
      };
      const created = makeGoal(dto);
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.upsert(USER_ID, dto);

      expect(result.monthly_min).toBe(500);
    });

    it('updates existing goal without losing monthly_min', async () => {
      const existing = makeGoal({ monthly_min: 200 });
      repo.findOne.mockResolvedValue(existing);
      const dto = {
        target_amount: 15000,
        deadline_month: 6,
        deadline_year: 2028,
        monthly_min: 400,
      };
      repo.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.upsert(USER_ID, dto);

      expect(repo.create).not.toHaveBeenCalled();
      expect(result.monthly_min).toBe(400);
    });
  });

  describe('upsert when monthly_min is omitted', () => {
    it('clears the monthly_min of an existing goal', async () => {
      const existing = makeGoal({ monthly_min: 200 });
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Goal));
      const dto = { target_amount: 15000, deadline_month: 6, deadline_year: 2028 };

      const result = await service.upsert(USER_ID, dto);

      expect(result.monthly_min).toBeNull();
    });
  });

  describe('upsert with saved_amount', () => {
    const baseDto = { target_amount: 15000, deadline_month: 6, deadline_year: 2028 };

    it('stores the saved_amount when creating a goal', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((data: Partial<Goal>) => data as Goal);
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Goal));

      const result = await service.upsert(USER_ID, { ...baseDto, saved_amount: 1200.5 });

      expect(result.saved_amount).toBe(1200.5);
    });

    it('replaces the saved_amount of an existing goal when provided', async () => {
      repo.findOne.mockResolvedValue(makeGoal({ saved_amount: 300 }));
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Goal));

      const result = await service.upsert(USER_ID, { ...baseDto, saved_amount: 900 });

      expect(result.saved_amount).toBe(900);
    });

    it('keeps the existing saved_amount when it is omitted', async () => {
      repo.findOne.mockResolvedValue(makeGoal({ saved_amount: 300 }));
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Goal));

      const result = await service.upsert(USER_ID, baseDto);

      expect(result.saved_amount).toBe(300);
    });

    it('keeps the existing saved_amount when it is explicitly undefined', async () => {
      repo.findOne.mockResolvedValue(makeGoal({ saved_amount: 300 }));
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Goal));

      const result = await service.upsert(USER_ID, { ...baseDto, saved_amount: undefined });

      expect(result.saved_amount).toBe(300);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when no goal exists', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(USER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
