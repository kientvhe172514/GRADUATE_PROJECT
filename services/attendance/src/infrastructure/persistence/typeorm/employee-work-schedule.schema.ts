import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WorkScheduleSchema } from './work-schedule.schema';

/**
 * EmployeeWorkScheduleSchema - TypeORM Schema for employee_work_schedules table
 *
 * Business Rules:
 * - Một employee có thể có nhiều work schedules theo thời gian
 * - effective_from/effective_to xác định khoảng thời gian áp dụng
 * - Không được overlap giữa các periods
 * - employee_code và department_id là cached data từ Employee Service
 */
@Entity('employee_work_schedules')
@Index(['employee_id'])
@Index(['work_schedule_id'])
@Index(['effective_from', 'effective_to'])
export class EmployeeWorkScheduleSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', comment: 'References employee_db.employees.id' })
  employee_id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Cached employee code from employee service',
  })
  employee_code: string | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Cached department_id from employee service',
  })
  department_id: number | null;

  @Column({ comment: 'References work_schedules.id' })
  work_schedule_id: number;

  @ManyToOne(() => WorkScheduleSchema, { eager: false })
  @JoinColumn({ name: 'work_schedule_id' })
  work_schedule?: WorkScheduleSchema;

  @Column({ type: 'date', comment: 'Ngày bắt đầu áp dụng lịch làm việc' })
  effective_from: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Ngày kết thúc (null = vô thời hạn)',
  })
  effective_to: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'bigint', nullable: true })
  created_by: number | null;
}
