import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type AccountType = 'personal' | 'business';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ unique: true })
  declare google_id: string;

  @Column()
  declare email: string;

  @Column({ nullable: true })
  declare name: string;

  @Column({ nullable: true })
  declare avatar: string;

  @Column({ type: 'varchar', nullable: true })
  declare account_type: AccountType | null;
}
