import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';

const USER_ID = 'user-uuid';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: USER_ID,
  google_id: 'google-1',
  email: 'owner@company.com',
  name: 'Owner',
  avatar: '',
  account_type: null,
  email_notifications: true,
  monthly_report: false,
  plan: 'free',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  subscription_status: null,
  current_period_end: null,
  ...overrides,
});

describe('UserService', () => {
  let service: UserService;
  let repo: { findOne: jest.Mock; find: jest.Mock; save: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), create: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [UserService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();

    service = module.get(UserService);
  });

  describe('findById', () => {
    it('returns the user matching the given id', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);

      const result = await service.findById(USER_ID);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: USER_ID } });
      expect(result).toBe(user);
    });

    it('returns null when no user matches the id', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findById(USER_ID);

      expect(result).toBeNull();
    });
  });

  describe('setAccountType', () => {
    it('persists the chosen account type on an existing user', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      repo.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.setAccountType(USER_ID, 'business');

      expect(result.account_type).toBe('business');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ account_type: 'business' }));
    });

    it('throws NotFoundException naming the id when the user is missing', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.setAccountType(USER_ID, 'personal')).rejects.toThrow(NotFoundException);
      await expect(service.setAccountType(USER_ID, 'personal')).rejects.toThrow(USER_ID);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('applies only the preferences that were sent', async () => {
      repo.findOne.mockResolvedValue(makeUser());
      repo.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.updateNotificationPreferences(USER_ID, { monthly_report: true });

      expect(result.monthly_report).toBe(true);
      expect(result.email_notifications).toBe(true);
    });

    it('throws NotFoundException when the user is missing', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateNotificationPreferences(USER_ID, { email_notifications: false }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('disableNotifications', () => {
    it('turns off both alerts and the monthly report', async () => {
      repo.findOne.mockResolvedValue(makeUser({ monthly_report: true }));
      repo.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.disableNotifications(USER_ID);

      expect(result.email_notifications).toBe(false);
      expect(result.monthly_report).toBe(false);
    });
  });

  describe('findNotificationRecipients', () => {
    it('lists users opted in to alerts or the report, ordered by id after the cursor', async () => {
      const users = [makeUser()];
      repo.find.mockResolvedValue(users);

      const result = await service.findNotificationRecipients('cursor-id', 50);

      expect(result).toBe(users);
      const options = repo.find.mock.calls[0][0] as {
        where: Array<Record<string, unknown>>;
        order: Record<string, string>;
        take: number;
      };
      expect(options.where).toHaveLength(2);
      expect(options.where[0]).toMatchObject({ email_notifications: true });
      expect(options.where[1]).toMatchObject({ monthly_report: true });
      expect(options.order).toEqual({ id: 'ASC' });
      expect(options.take).toBe(50);
    });

    it('starts from the first user when no cursor is given', async () => {
      repo.find.mockResolvedValue([]);

      await service.findNotificationRecipients(undefined, 10);

      const options = repo.find.mock.calls[0][0] as { where: Array<Record<string, unknown>> };
      expect(options.where[0]).not.toHaveProperty('id');
    });
  });
});
