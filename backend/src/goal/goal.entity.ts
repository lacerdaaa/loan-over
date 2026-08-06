import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare target_amount: number;

  @Column({ type: 'int' })
  declare deadline_month: number;

  @Column({ type: 'int' })
  declare deadline_year: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  declare monthly_min: number | null;
}
