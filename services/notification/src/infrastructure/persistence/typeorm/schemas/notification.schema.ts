import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
@Index(['recipient_id', 'created_at'])
@Index(['recipient_id', 'is_read'])
export class NotificationSchema {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  recipient_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient_email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient_name: string | null;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  notification_type: string;

  @Column({ type: 'varchar', length: 20, default: 'NORMAL' })
  priority: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  related_entity_type: string | null;

  @Column({ type: 'bigint', nullable: true })
  related_entity_id: number | null;

  @Column({ type: 'jsonb', nullable: true })
  related_data: object | null;

  @Column({ type: 'jsonb' })
  channels: string[];

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @Column({ type: 'boolean', default: false })
  email_sent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  email_sent_at: Date | null;

  @Column({ type: 'boolean', default: false })
  push_sent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  push_sent_at: Date | null;

  @Column({ type: 'boolean', default: false })
  sms_sent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  sms_sent_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: object | null;

  @CreateDateColumn({ type: 'timestamp' })
  @Index()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;
}
