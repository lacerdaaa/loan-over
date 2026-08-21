import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

export type EmployeeRegime = 'clt' | 'pj';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'varchar' })
  declare regime: EmployeeRegime;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare gross_salary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  declare monthly_benefits: number;

  @Column({ default: true })
  declare active: boolean;
}
