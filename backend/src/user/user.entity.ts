import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
