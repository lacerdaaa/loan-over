import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { OrganizationService } from './organization.service';

const USER_ID = 'user-uuid';

const makeOrg = (overrides: Partial<Organization> = {}): Organization =>
  ({ id: 'org-1', name: 'Acme', cnpj: null, cash_balance: 50000, ...overrides }) as Organization;

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: getRepositoryToken(Organization), useValue: repo },
      ],
    }).compile();

    service = module.get(OrganizationService);
  });

  describe('find', () => {
    it('returns the organization owned by the given user', async () => {
      const org = makeOrg();
      repo.findOne.mockResolvedValue(org);

      const result = await service.find(USER_ID);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { user: { id: USER_ID } } });
      expect(result).toBe(org);
    });

    it('returns null when the user has no organization', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.find(USER_ID);

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('creates a new organization when none exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const dto = { name: 'Acme', cnpj: '12.345.678/0001-90', cash_balance: 80000 };
      const created = makeOrg(dto);
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.upsert(USER_ID, dto);

      expect(repo.create).toHaveBeenCalledWith({ user: { id: USER_ID }, ...dto });
      expect(result.name).toBe('Acme');
    });

    it('updates the existing organization without creating a new one', async () => {
      const existing = makeOrg({ name: 'Old Co', cash_balance: 10000 });
      repo.findOne.mockResolvedValue(existing);
      const dto = { name: 'New Co', cnpj: null, cash_balance: 25000 };
      repo.save.mockImplementation((o: Organization) => Promise.resolve(o));

      const result = await service.upsert(USER_ID, dto);

      expect(repo.create).not.toHaveBeenCalled();
      expect(result.name).toBe('New Co');
      expect(result.cash_balance).toBe(25000);
    });
  });
});
