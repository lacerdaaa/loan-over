import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type UserPlan = 'free' | 'pro';

export type AccountType = 'personal' | 'business';

export interface NotificationPreferences {
  email_notifications: boolean;
  monthly_report: boolean;
}

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

  @Column({ default: true })
  declare email_notifications: boolean;

  @Column({ default: false })
  declare monthly_report: boolean;

  @Column({ type: 'varchar', default: 'free' })
  declare plan: UserPlan;

  @Column({ type: 'varchar', nullable: true })
  declare stripe_customer_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  declare stripe_subscription_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  declare subscription_status: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  declare current_period_end: Date | null;
}
