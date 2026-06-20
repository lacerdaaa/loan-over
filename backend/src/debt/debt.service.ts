import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { CreateDebtDto } from './dto/create-debt.dto';
import { Debt } from './debt.entity';

@Injectable()
export class DebtService {
  constructor(
    @InjectRepository(Debt)
    private readonly repo: Repository<Debt>,
  ) {}

  findAll(): Promise<Debt[]> {
    return this.repo.find();
  }

  async create(dto: CreateDebtDto): Promise<Debt> {
    const debt = this.repo.create({
      ...dto,
      start_date: new Date(dto.start_date),
      paid_installments: dto.paid_installments ?? 0,
      closed: false,
    });
    return this.repo.save(debt);
  }

  async payInstallment(id: string): Promise<Debt> {
    const debt = await this.repo.findOneBy({ id });
    if (!debt) throw new NotFoundException(`Debt ${id} not found`);
    if (debt.closed) throw new BadRequestException(`Debt ${id} is already closed`);

    debt.paid_installments += 1;
    debt.closed = debt.paid_installments === debt.total_installments;

    return this.repo.save(debt);
  }

  async remove(id: string): Promise<void> {
    const exists = await this.repo.findOneBy({ id });
    if (!exists) throw new NotFoundException(`Debt ${id} not found`);
    await this.repo.delete(id);
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async autoIncrementInstallments(): Promise<void> {
    const activeDebts = await this.repo.find({ where: { closed: false } });
    for (const debt of activeDebts) {
      debt.paid_installments += 1;
      debt.closed = debt.paid_installments === debt.total_installments;
      await this.repo.save(debt);
    }
  }
}
