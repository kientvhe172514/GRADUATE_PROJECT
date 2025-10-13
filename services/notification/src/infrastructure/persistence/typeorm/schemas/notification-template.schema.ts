import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplateSchema {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  template_code: string;

  @Column({ type: 'varchar', length: 255 })
  template_name: string;

  @Column({ type: 'varchar', length: 50 })
  notification_type: string;

  @Column({ type: 'varchar', length: 500 })
  title_template: string;

  @Column({ type: 'text' })
  message_template: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  email_subject_template: string;

  @Column({ type: 'text', nullable: true })
  email_body_template: string;

  @Column({ type: 'jsonb' })
  default_channels: string[];

  @Column({ type: 'jsonb', nullable: true })
  available_variables: object;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
