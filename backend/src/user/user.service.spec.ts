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
  ...overrides,
});

describe('UserService', () => {
  let service: UserService;
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };

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
});
