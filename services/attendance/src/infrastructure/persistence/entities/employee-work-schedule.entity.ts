import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WorkScheduleEntity } from './work-schedule.entity';

/**
 * EmployeeWorkScheduleEntity - Link nhân viên với work schedule
 *
 * Business Rules:
 * - Một employee có thể có nhiều work schedules theo thời gian
 * - effective_from/effective_to xác định khoảng thời gian áp dụng
 * - Không được overlap giữa các periods
 */
@Entity('employee_work_schedules')
@Index(['employee_id'])
@Index(['effective_from', 'effective_to'])
export class EmployeeWorkScheduleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', comment: 'References employee_db.employees.id' })
  employee_id: number;

  @Column({ comment: 'References work_schedules.id' })
  work_schedule_id: number;

  @ManyToOne(() => WorkScheduleEntity)
  @JoinColumn({ name: 'work_schedule_id' })
  work_schedule: WorkScheduleEntity;

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
