import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { IncomeType } from '../shared/types';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { CreateIncomeDto } from './dto/create-income.dto';
import { IncomeDeduction } from './income-deduction.entity';
import { Income } from './income.entity';

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private readonly repo: Repository<Income>,
    @InjectRepository(IncomeDeduction)
    private readonly deductionRepo: Repository<IncomeDeduction>,
  ) {}

  async findForMonth(month: number, year: number): Promise<Income[]> {
    const fixedWhere: FindOptionsWhere<Income> = { type: IncomeType.FIXED };
    const variableWhere: FindOptionsWhere<Income> = { type: IncomeType.VARIABLE, month, year };

    const [fixed, variable] = await Promise.all([
      this.repo.find({ where: fixedWhere }),
      this.repo.find({ where: variableWhere }),
    ]);

    return [...fixed, ...variable];
  }

  netAmount(income: Income): number {
    return Number(income.amount) -
      (income.deductions ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  }

  async create(dto: CreateIncomeDto): Promise<Income> {
    const income = this.repo.create({
      type: dto.type,
      category: dto.category,
      amount: dto.amount,
      description: dto.description,
      month: dto.month ?? null,
      year: dto.year ?? null,
      deductions: [],
    });
    return this.repo.save(income);
  }

  async addDeduction(incomeId: string, dto: CreateDeductionDto): Promise<IncomeDeduction> {
    const income = await this.repo.findOne({ where: { id: incomeId } });
    if (!income) throw new NotFoundException(`Income ${incomeId} not found`);

    const deduction = this.deductionRepo.create({ ...dto, income });
    return this.deductionRepo.save(deduction);
  }

  async removeDeduction(deductionId: string): Promise<void> {
    const exists = await this.deductionRepo.findOneBy({ id: deductionId });
    if (!exists) throw new NotFoundException(`Deduction ${deductionId} not found`);
    await this.deductionRepo.delete(deductionId);
  }

  async remove(id: string): Promise<void> {
    const exists = await this.repo.findOneBy({ id });
    if (!exists) throw new NotFoundException(`Income ${id} not found`);
    await this.repo.delete(id);
  }
}
