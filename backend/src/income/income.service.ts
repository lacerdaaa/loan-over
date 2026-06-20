import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { IncomeType } from '../shared/types';
import { CreateIncomeDto } from './dto/create-income.dto';
import { Income } from './income.entity';

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private readonly repo: Repository<Income>,
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

  async create(dto: CreateIncomeDto): Promise<Income> {
    const income = this.repo.create({
      ...dto,
      month: dto.month ?? null,
      year: dto.year ?? null,
    });
    return this.repo.save(income);
  }

  async remove(id: string): Promise<void> {
    const exists = await this.repo.findOneBy({ id });
    if (!exists) throw new NotFoundException(`Income ${id} not found`);
    await this.repo.delete(id);
  }
}
