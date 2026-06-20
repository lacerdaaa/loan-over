import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fixed_expenses')
export class FixedExpense {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare amount: number;

  @Column({ type: 'int' })
  declare due_day: number;

  @Column({ default: true })
  declare active: boolean;
}
