import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  findAll(userId: string): Promise<Employee[]> {
    return this.repo.find({ where: { user: { id: userId } }, order: { name: 'ASC' } });
  }

  create(userId: string, dto: CreateEmployeeDto): Promise<Employee> {
    const employee = this.repo.create({ user: { id: userId }, ...dto });
    return this.repo.save(employee);
  }

  async update(userId: string, id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);

    Object.assign(employee, dto);
    return this.repo.save(employee);
  }

  async remove(userId: string, id: string): Promise<void> {
    const employee = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);
    await this.repo.delete(id);
  }
}
