import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Client } from './Client';

@Entity('payment_sessions')
export class PaymentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  session_id: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column('decimal', { precision: 14, scale: 2 })
  amount: string;

  @Column()
  token_hash: string;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}