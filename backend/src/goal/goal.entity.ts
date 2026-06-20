import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare target_amount: number;

  @Column({ type: 'int' })
  declare deadline_month: number;

  @Column({ type: 'int' })
  declare deadline_year: number;
}
