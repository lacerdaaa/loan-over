import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeService } from './employee.service';

const USER_ID = 'user-uuid';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const makeEmployee = (overrides: Partial<Employee> = {}): Employee =>
  ({
    id: 'emp-1',
    name: 'Alice',
    regime: 'clt',
    gross_salary: 5000,
    monthly_benefits: 0,
    active: true,
    ...overrides,
  }) as Employee;

describe('EmployeeService', () => {
  let service: EmployeeService;
  let repo: jest.Mocked<Repository<Employee>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: getRepositoryToken(Employee), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get(EmployeeService);
    repo = module.get(getRepositoryToken(Employee));
  });

  describe('findAll', () => {
    it('returns all employees for the given user ordered by name', async () => {
      const employees = [makeEmployee({ name: 'Alice' }), makeEmployee({ id: 'emp-2', name: 'Bob' })];
      repo.find.mockResolvedValue(employees);

      const result = await service.findAll(USER_ID);

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: USER_ID } },
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('creates and returns a new employee', async () => {
      const dto = { name: 'Alice', regime: 'clt' as const, gross_salary: 5000 };
      const employee = makeEmployee(dto);
      repo.create.mockReturnValue(employee);
      repo.save.mockResolvedValue(employee);

      const result = await service.create(USER_ID, dto);

      expect(repo.create).toHaveBeenCalledWith({
        user: { id: USER_ID },
        ...dto,
      });
      expect(result.name).toBe('Alice');
    });
  });

  describe('update', () => {
    it('updates an existing employee and returns it', async () => {
      const employee = makeEmployee({ gross_salary: 5000 });
      const updated = makeEmployee({ gross_salary: 6000 });
      repo.findOne.mockResolvedValue(employee);
      repo.save.mockResolvedValue(updated);

      const result = await service.update(USER_ID, 'emp-1', { gross_salary: 6000 });

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'emp-1', user: { id: USER_ID } } });
      expect(result.gross_salary).toBe(6000);
    });

    it('throws NotFoundException when the employee does not belong to the user', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(USER_ID, 'ghost', {})).rejects.toThrow(NotFoundException);
    });

    it('includes the id in the NotFoundException message', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(USER_ID, 'ghost-id', {})).rejects.toThrow('ghost-id');
    });
  });

  describe('remove', () => {
    it('deletes the employee when it exists', async () => {
      const employee = makeEmployee();
      repo.findOne.mockResolvedValue(employee);
      repo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(USER_ID, 'emp-1');

      expect(repo.delete).toHaveBeenCalledWith('emp-1');
    });

    it('throws NotFoundException when employee does not belong to the user', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'ghost')).rejects.toThrow(NotFoundException);
    });

    it('includes the id in the NotFoundException message', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'ghost-id')).rejects.toThrow('ghost-id');
    });
  });
});
