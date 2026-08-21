import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

export type MatchKind =
  | 'income'
  | 'fixed_expense'
  | 'debt'
  | 'occasional_expense'
  | 'payroll'
  | 'ignored';

@Entity('bank_transactions')
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ type: 'date' })
  declare date: string;

  @Column({ type: 'varchar' })
  declare description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  declare amount: number;

  @Column({ type: 'int' })
  declare month: number;

  @Column({ type: 'int' })
  declare year: number;

  @Column({ type: 'varchar', nullable: true })
  declare matched_kind: MatchKind | null;

  @Column({ type: 'uuid', nullable: true })
  declare matched_id: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  declare import_hash: string;
}
