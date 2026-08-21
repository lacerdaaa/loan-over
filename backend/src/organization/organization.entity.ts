import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

export type TaxRegime = 'simples' | 'lucro';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ type: 'varchar' })
  declare name: string;

  @Column({ type: 'varchar', nullable: true })
  declare cnpj: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  declare cash_balance: number;

  @Column({ type: 'varchar', default: 'simples' })
  declare tax_regime: TaxRegime;
}
