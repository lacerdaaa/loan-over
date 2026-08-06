import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('debts')
export class Debt {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

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

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  declare principal: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  declare monthly_rate: number | null;
}
