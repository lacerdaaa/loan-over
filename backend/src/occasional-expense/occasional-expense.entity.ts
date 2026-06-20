import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('occasional_expenses')
export class OccasionalExpense {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare amount: number;

  @Column({ type: 'int' })
  declare month: number;

  @Column({ type: 'int' })
  declare year: number;

  @Column({ default: false })
  declare from_benefit: boolean;
}
