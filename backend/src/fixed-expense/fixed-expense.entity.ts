import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('fixed_expenses')
export class FixedExpense {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column()
  declare name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare amount: number;

  @Column({ type: 'int' })
  declare due_day: number;

  @Column({ default: true })
  declare active: boolean;

  @Column({ default: false })
  declare from_benefit: boolean;

  @Column({ type: 'int', nullable: true, default: null })
  declare valid_from_month: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  declare valid_from_year: number | null;
}
