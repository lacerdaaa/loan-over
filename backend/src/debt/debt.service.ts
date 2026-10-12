import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { Debt } from './debt.entity';

const NON_COPIED_UPDATE_FIELDS: ReadonlySet<string> = new Set(['start_date', 'installment_amount']);

@Injectable()
export class DebtService {
  constructor(
    @InjectRepository(Debt)
    private readonly repo: Repository<Debt>,
  ) {}

  findAll(userId: string): Promise<Debt[]> {
    return this.repo.find({ where: { user: { id: userId } } });
  }

  async create(userId: string, dto: CreateDebtDto): Promise<Debt> {
    const installment_amount =
      dto.principal != null && dto.monthly_rate != null
        ? this.priceInstallment(dto.principal, dto.monthly_rate, dto.total_installments)
        : dto.installment_amount!;

    const debt = this.repo.create({
      user: { id: userId },
      name: dto.name,
      installment_amount,
      total_installments: dto.total_installments,
      paid_installments: dto.paid_installments ?? 0,
      start_date: new Date(dto.start_date),
      principal: dto.principal ?? null,
      monthly_rate: dto.monthly_rate ?? null,
      closed: false,
    });
    this.applyClosingRule(debt);
    return this.repo.save(debt);
  }

  private priceInstallment(principal: number, rate: number, n: number): number {
    if (rate === 0) return principal / n;
    return (principal * rate) / (1 - Math.pow(1 + rate, -n));
  }

  private applyClosingRule(debt: Debt): void {
    debt.closed = debt.paid_installments >= debt.total_installments;
  }

  async payInstallment(id: string, userId: string): Promise<Debt> {
    const debt = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!debt) throw new NotFoundException(`Debt ${id} not found`);
    if (debt.closed) throw new BadRequestException(`Debt ${id} is already closed`);

    debt.paid_installments += 1;
    this.applyClosingRule(debt);

    return this.repo.save(debt);
  }

  async update(id: string, userId: string, dto: UpdateDebtDto): Promise<Debt> {
    const debt = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!debt) throw new NotFoundException(`Debt ${id} not found`);

    this.applyFields(debt, dto);
    this.applyInstallment(debt, dto);
    this.applyClosingRule(debt);

    return this.repo.save(debt);
  }

  private applyFields(debt: Debt, dto: UpdateDebtDto): void {
    const copied = Object.entries(dto).filter(
      ([key, value]) => value !== undefined && !NON_COPIED_UPDATE_FIELDS.has(key),
    );
    Object.assign(debt, Object.fromEntries(copied));
    if (dto.start_date !== undefined) debt.start_date = new Date(dto.start_date);
  }

  private applyInstallment(debt: Debt, dto: UpdateDebtDto): void {
    const pricingChanged =
      dto.principal !== undefined ||
      dto.monthly_rate !== undefined ||
      dto.total_installments !== undefined;
    const hasPriceData = debt.principal != null && debt.monthly_rate != null;

    if (pricingChanged && hasPriceData) {
      debt.installment_amount = this.priceInstallment(
        Number(debt.principal),
        Number(debt.monthly_rate),
        debt.total_installments,
      );
      return;
    }
    if (dto.installment_amount !== undefined) debt.installment_amount = dto.installment_amount;
  }

  async remove(id: string, userId: string): Promise<void> {
    const exists = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!exists) throw new NotFoundException(`Debt ${id} not found`);
    await this.repo.delete(id);
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async autoIncrementInstallments(): Promise<void> {
    const activeDebts = await this.repo.find({ where: { closed: false } });
    for (const debt of activeDebts) {
      debt.paid_installments += 1;
      this.applyClosingRule(debt);
      await this.repo.save(debt);
    }
  }
}
