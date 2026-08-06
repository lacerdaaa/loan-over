import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Income } from './income.entity';

@Entity('income_deductions')
export class IncomeDeduction {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare label: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare amount: number;

  @ManyToOne(() => Income, (i) => i.deductions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'income_id' })
  declare income: Income;
}
