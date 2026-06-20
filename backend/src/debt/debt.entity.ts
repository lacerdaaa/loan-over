import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('debts')
export class Debt {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column()
  declare name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare installment_amount: number;

  @Column({ type: 'int' })
  declare total_installments: number;

  @Column({ type: 'int', default: 0 })
  declare paid_installments: number;

  @Column({ type: 'date' })
  declare start_date: Date;

  @Column({ default: false })
  declare closed: boolean;
}
