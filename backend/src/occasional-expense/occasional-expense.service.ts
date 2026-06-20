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

  findForMonth(month: number, year: number): Promise<OccasionalExpense[]> {
    return this.repo.find({ where: { month, year } });
  }

  async create(dto: CreateOccasionalExpenseDto): Promise<OccasionalExpense> {
    const expense = this.repo.create({ ...dto, from_benefit: dto.from_benefit ?? false });
    return this.repo.save(expense);
  }

  async remove(id: string): Promise<void> {
    const exists = await this.repo.findOneBy({ id });
    if (!exists) throw new NotFoundException(`OccasionalExpense ${id} not found`);
    await this.repo.delete(id);
  }
}
