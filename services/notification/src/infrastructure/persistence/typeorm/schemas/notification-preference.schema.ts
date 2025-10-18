import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_preferences')
@Index(['employee_id', 'notification_type'], { unique: true })
@Index(['employee_id'])
export class NotificationPreferenceSchema {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint' })
  employee_id: number;

  @Column({ type: 'varchar', length: 50 })
  notification_type: string;

  @Column({ type: 'boolean', default: true })
  email_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  push_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  sms_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  in_app_enabled: boolean;

  @Column({ type: 'time', nullable: true })
  do_not_disturb_start: string | null;

  @Column({ type: 'time', nullable: true })
  do_not_disturb_end: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
