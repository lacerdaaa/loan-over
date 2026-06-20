import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';
import { FixedExpense } from './fixed-expense.entity';

@Injectable()
export class FixedExpenseService {
  constructor(
    @InjectRepository(FixedExpense)
    private readonly repo: Repository<FixedExpense>,
  ) {}

  findAll(): Promise<FixedExpense[]> {
    return this.repo.find();
  }

  async create(dto: CreateFixedExpenseDto): Promise<FixedExpense> {
    const expense = this.repo.create({ ...dto, active: dto.active ?? true, from_benefit: dto.from_benefit ?? false });
    return this.repo.save(expense);
  }

  async update(id: string, dto: UpdateFixedExpenseDto): Promise<FixedExpense> {
    const expense = await this.repo.findOneBy({ id });
    if (!expense) throw new NotFoundException(`FixedExpense ${id} not found`);

    Object.assign(expense, dto);
    return this.repo.save(expense);
  }

  async remove(id: string): Promise<void> {
    const exists = await this.repo.findOneBy({ id });
    if (!exists) throw new NotFoundException(`FixedExpense ${id} not found`);
    await this.repo.delete(id);
  }
}
