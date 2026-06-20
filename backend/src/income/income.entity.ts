import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IncomeType } from '../shared/types';

@Entity('incomes')
export class Income {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'enum', enum: IncomeType })
  declare type: IncomeType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare amount: number;

  @Column({ type: 'int', nullable: true })
  declare month: number | null;

  @Column({ type: 'int', nullable: true })
  declare year: number | null;

  @Column()
  declare description: string;
}
