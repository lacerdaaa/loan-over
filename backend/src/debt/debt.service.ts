import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
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
    const installment_amount = (dto.principal != null && dto.monthly_rate != null)
      ? this.priceInstallment(dto.principal, dto.monthly_rate, dto.total_installments)
      : dto.installment_amount!;

    const debt = this.repo.create({
      name: dto.name,
      installment_amount,
      total_installments: dto.total_installments,
      paid_installments: dto.paid_installments ?? 0,
      start_date: new Date(dto.start_date),
      principal: dto.principal ?? null,
      monthly_rate: dto.monthly_rate ?? null,
      closed: false,
    });
    return this.repo.save(debt);
  }

  private priceInstallment(principal: number, rate: number, n: number): number {
    return (principal * rate) / (1 - Math.pow(1 + rate, -n));
  }

  async payInstallment(id: string): Promise<Debt> {
    const debt = await this.repo.findOneBy({ id });
    if (!debt) throw new NotFoundException(`Debt ${id} not found`);
    if (debt.closed) throw new BadRequestException(`Debt ${id} is already closed`);

    debt.paid_installments += 1;
    debt.closed = debt.paid_installments === debt.total_installments;

    return this.repo.save(debt);
  }

  async update(id: string, dto: UpdateDebtDto): Promise<Debt> {
    const debt = await this.repo.findOneBy({ id });
    if (!debt) throw new NotFoundException(`Debt ${id} not found`);

    if (dto.name !== undefined) debt.name = dto.name;
    if (dto.total_installments !== undefined) debt.total_installments = dto.total_installments;
    if (dto.paid_installments !== undefined) debt.paid_installments = dto.paid_installments;
    if (dto.start_date !== undefined) debt.start_date = new Date(dto.start_date);
    if (dto.principal !== undefined) debt.principal = dto.principal ?? null;
    if (dto.monthly_rate !== undefined) debt.monthly_rate = dto.monthly_rate ?? null;

    const principal = dto.principal ?? (debt.principal ? Number(debt.principal) : null);
    const rate = dto.monthly_rate ?? (debt.monthly_rate ? Number(debt.monthly_rate) : null);
    const n = debt.total_installments;

    if (principal != null && rate != null) {
      debt.installment_amount = this.priceInstallment(principal, rate, n);
    } else if (dto.installment_amount !== undefined) {
      debt.installment_amount = dto.installment_amount;
    }

    debt.closed = debt.paid_installments >= debt.total_installments;

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
