import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { Debt } from './debt.entity';
import { dayKey, monthStartKey } from './debt-month.utils';

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

  private countInstallment(debt: Debt, monthStart: string): void {
    debt.paid_installments += 1;
    debt.last_paid_month = monthStart;
    this.applyClosingRule(debt);
  }

  private applyClosingRule(debt: Debt): void {
    debt.closed = debt.paid_installments >= debt.total_installments;
  }

  async payInstallment(id: string, userId: string): Promise<Debt> {
    const debt = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!debt) throw new NotFoundException(`Debt ${id} not found`);
    if (debt.closed) throw new BadRequestException(`Debt ${id} is already closed`);

    this.countInstallment(debt, monthStartKey(new Date()));

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
    const result = await this.repo.delete({ id, user: { id: userId } });
    if (!result.affected) throw new NotFoundException(`Debt ${id} not found`);
  }

  advanceForMonth(debts: Debt[], now: Date): Debt[] {
    const monthStart = monthStartKey(now);
    const due = debts.filter((debt) => this.isDueForMonth(debt, monthStart));
    due.forEach((debt) => this.countInstallment(debt, monthStart));
    return due;
  }

  private isDueForMonth(debt: Debt, monthStart: string): boolean {
    const hasStarted = dayKey(debt.start_date) <= monthStart;
    const alreadyCounted = debt.last_paid_month != null && debt.last_paid_month >= monthStart;
    return !debt.closed && hasStarted && !alreadyCounted;
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async autoIncrementInstallments(): Promise<void> {
    const openDebts = await this.repo.find({ where: { closed: false } });
    const advanced = this.advanceForMonth(openDebts, new Date());
    await this.repo.save(advanced);
  }
}
