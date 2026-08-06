import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOccasionalExpenseDto } from './dto/create-occasional-expense.dto';
import { OccasionalExpense } from './occasional-expense.entity';

@Injectable()
export class OccasionalExpenseService {
  constructor(
    @InjectRepository(OccasionalExpense)
    private readonly repo: Repository<OccasionalExpense>,
  ) {}

  findForMonth(userId: string, month: number, year: number): Promise<OccasionalExpense[]> {
    return this.repo.find({ where: { month, year, user: { id: userId } } });
  }

  async create(userId: string, dto: CreateOccasionalExpenseDto): Promise<OccasionalExpense> {
    const expense = this.repo.create({
      user: { id: userId },
      ...dto,
      from_benefit: dto.from_benefit ?? false,
    });
    return this.repo.save(expense);
  }

  async remove(id: string, userId: string): Promise<void> {
    const exists = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!exists) throw new NotFoundException(`OccasionalExpense ${id} not found`);
    await this.repo.delete(id);
  }
}
