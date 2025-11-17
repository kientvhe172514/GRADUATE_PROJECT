import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('attendance_edit_logs')
@Index(['shift_id', 'edited_at'])
@Index(['employee_id', 'edited_at'])
@Index(['edited_by_user_id', 'edited_at'])
export class AttendanceEditLogSchema {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  @Index()
  shift_id: number;

  @Column({ type: 'bigint' })
  @Index()
  employee_id: number;

  @Column({ type: 'varchar', length: 50 })
  employee_code: string;

  @Column({ type: 'date' })
  shift_date: Date;

  @Column({ type: 'bigint' })
  @Index()
  edited_by_user_id: number;

  @Column({ type: 'varchar', length: 255 })
  edited_by_user_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  edited_by_role?: string;

  @Column({ type: 'varchar', length: 100 })
  field_changed: string;

  @Column({ type: 'text', nullable: true })
  old_value?: string;

  @Column({ type: 'text', nullable: true })
  new_value?: string;

  @Column({ type: 'text', nullable: true })
  edit_reason?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address?: string;

  @CreateDateColumn()
  @Index()
  edited_at: Date;
}
