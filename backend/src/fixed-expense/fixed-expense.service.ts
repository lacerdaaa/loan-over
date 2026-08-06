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

  findAll(userId: string): Promise<FixedExpense[]> {
    return this.repo.find({ where: { user: { id: userId } } });
  }

  async create(userId: string, dto: CreateFixedExpenseDto): Promise<FixedExpense> {
    const expense = this.repo.create({
      user: { id: userId },
      ...dto,
      active: dto.active ?? true,
      from_benefit: dto.from_benefit ?? false,
    });
    return this.repo.save(expense);
  }

  async update(id: string, userId: string, dto: UpdateFixedExpenseDto): Promise<FixedExpense> {
    const expense = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!expense) throw new NotFoundException(`FixedExpense ${id} not found`);

    Object.assign(expense, dto);
    return this.repo.save(expense);
  }

  async remove(id: string, userId: string): Promise<void> {
    const exists = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!exists) throw new NotFoundException(`FixedExpense ${id} not found`);
    await this.repo.delete(id);
  }
}
