import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('clients')
@Unique(['document', 'phone'])
@Unique(['email'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  document: string;

  @Column()
  names: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  balance: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}