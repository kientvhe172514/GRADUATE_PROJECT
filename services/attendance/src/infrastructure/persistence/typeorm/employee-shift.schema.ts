import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('employee_shifts')
// 🔒 UNIQUE constraint để prevent duplicate shifts
@Index(
  'UQ_employee_shift_time',
  [
    'employee_id',
    'shift_date',
    'scheduled_start_time',
    'scheduled_end_time',
    'shift_type',
  ],
  { unique: true },
)
// Performance indexes
@Index(['employee_id', 'shift_date', 'shift_type'])
@Index(['shift_date'])
@Index(['status'])
@Index(['shift_type'])
export class EmployeeShiftSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  employee_id: number;

  @Column({ type: 'varchar', length: 50 })
  employee_code: string;

  @Column({ type: 'integer' })
  department_id: number;

  @Column({ type: 'date' })
  shift_date: Date;

  @Column({ type: 'integer', nullable: true })
  work_schedule_id?: number;

  // Time tracking
  @Column({ type: 'timestamptz', nullable: true })
  check_in_time?: Date;

  @Column({ type: 'integer', nullable: true })
  check_in_record_id?: number;

  @Column({ type: 'timestamptz', nullable: true })
  check_out_time?: Date;

  @Column({ type: 'integer', nullable: true })
  check_out_record_id?: number;

  @Column({ type: 'varchar', length: 8 })
  scheduled_start_time: string; // HH:MM format

  @Column({ type: 'varchar', length: 8 })
  scheduled_end_time: string; // HH:MM format

  // Calculated hours
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  work_hours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtime_hours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  break_hours: number;

  // Violations
  @Column({ type: 'integer', default: 0 })
  late_minutes: number;

  @Column({ type: 'integer', default: 0 })
  early_leave_minutes: number;

  // Presence verification
  @Column({ type: 'boolean', default: false })
  presence_verification_required: boolean;

  @Column({ type: 'boolean', default: false })
  presence_verified: boolean;

  @Column({ type: 'integer', default: 0 })
  presence_verification_rounds_completed: number;

  @Column({ type: 'integer', default: 0 })
  presence_verification_rounds_required: number;

  // Status
  @Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
  status: string; // SCHEDULED, IN_PROGRESS, COMPLETED, ON_LEAVE, ABSENT

  // Shift Type (REGULAR or OVERTIME)
  @Column({ type: 'varchar', length: 20, default: 'REGULAR' })
  shift_type: string; // REGULAR, OVERTIME

  // Approval
  @Column({ type: 'integer', nullable: true })
  approved_by?: number;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date;

  // Manual edit flag
  @Column({ type: 'boolean', default: false })
  is_manually_edited: boolean;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'integer', nullable: true })
  created_by?: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'integer', nullable: true })
  updated_by?: number;
}
