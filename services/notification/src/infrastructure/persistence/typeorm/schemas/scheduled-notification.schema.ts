import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('scheduled_notifications')
@Index(['next_run_at'])
@Index(['status'])
export class ScheduledNotificationSchema {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50 })
  schedule_type: string;

  @Column({ type: 'varchar', length: 20 })
  recipient_type: string;

  @Column({ type: 'jsonb', nullable: true })
  recipient_ids: number[];

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50 })
  notification_type: string;

  @Column({ type: 'jsonb' })
  channels: string[];

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cron_expression: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  last_run_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  next_run_at: Date;

  @Column({ type: 'bigint' })
  created_by: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
