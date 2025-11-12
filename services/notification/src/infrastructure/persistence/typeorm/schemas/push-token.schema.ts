import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('push_notification_tokens')
@Index(['employee_id', 'device_id'], { unique: true })
@Index(['employee_id'])
@Index(['token'])
@Index(['device_session_id'])
export class PushTokenSchema {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint' })
  employee_id: number;

  @Column({ type: 'varchar', length: 255 })
  device_id: string;

  @Column({ type: 'bigint', nullable: true })
  device_session_id: number;

  @Column({ type: 'varchar', length: 500 })
  token: string;

  @Column({ type: 'varchar', length: 20 })
  platform: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_used_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
