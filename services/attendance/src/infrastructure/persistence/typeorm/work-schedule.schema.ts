import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('work_schedules')
@Index(['status'])
export class WorkScheduleSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  schedule_name: string;

  @Column({ type: 'varchar', length: 50 })
  schedule_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  work_days?: string;

  @Column({ type: 'time', nullable: true })
  start_time?: string;

  @Column({ type: 'time', nullable: true })
  end_time?: string;

  @Column({ type: 'int', default: 0 })
  break_duration_minutes: number;

  @Column({ type: 'int', default: 15 })
  late_tolerance_minutes: number;

  @Column({ type: 'int', default: 15 })
  early_leave_tolerance_minutes: number;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  created_by?: number;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by?: number;
}

// NOTE: EmployeeWorkScheduleSchema was moved to employee-work-schedule.schema.ts.
// This file now only contains WorkScheduleSchema to avoid duplicate entity metadata.
