import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IncomeCategory, IncomeType } from '../shared/types';
import { IncomeDeduction } from './income-deduction.entity';

@Entity('incomes')
export class Income {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'enum', enum: IncomeType })
  declare type: IncomeType;

  @Column({ type: 'enum', enum: IncomeCategory, default: IncomeCategory.OTHER })
  declare category: IncomeCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare amount: number;

  @Column({ type: 'int', nullable: true })
  declare month: number | null;

  @Column({ type: 'int', nullable: true })
  declare year: number | null;

  @Column()
  declare description: string;

  @OneToMany(() => IncomeDeduction, (d) => d.income, { cascade: true, eager: true })
  declare deductions: IncomeDeduction[];
}
