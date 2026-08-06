import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('occasional_expenses')
export class OccasionalExpense {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

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
