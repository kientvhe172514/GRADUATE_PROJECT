import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EmployeeShiftEntity } from './employee-shift.entity';

/**
 * OvertimeRequestEntity - Quản lý đơn xin làm thêm giờ
 *
 * Workflow:
 * 1. Employee tạo OT request trước khi làm
 * 2. Manager approve/reject
 * 3. Sau khi làm xong, actual_hours được tính từ attendance
 * 4. Link với employee_shift để track thực tế
 */
@Entity('overtime_requests')
@Index(['employee_id'])
@Index(['status'])
@Index(['overtime_date'])
export class OvertimeRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', comment: 'References employee_db.employees.id' })
  employee_id: number;

  @Column({
    nullable: true,
    comment: 'Link to shift nếu OT trong ngày làm việc thường',
  })
  shift_id: number | null;

  @ManyToOne(() => EmployeeShiftEntity, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: EmployeeShiftEntity | null;

  @Column({ type: 'date', comment: 'Ngày làm OT' })
  overtime_date: Date;

  @Column({ type: 'timestamptz', comment: 'Giờ bắt đầu OT' })
  start_time: Date;

  @Column({ type: 'timestamptz', comment: 'Giờ kết thúc OT dự kiến' })
  end_time: Date;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: 'Số giờ OT dự kiến',
  })
  estimated_hours: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Số giờ OT thực tế (từ attendance)',
  })
  actual_hours: number | null;

  @Column({ type: 'text', comment: 'Lý do làm OT' })
  reason: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDING',
    comment: 'PENDING, APPROVED, REJECTED',
  })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requested_at: Date;

  @Column({ type: 'bigint', nullable: true })
  requested_by: number | null;

  // Approval
  @Column({ type: 'bigint', nullable: true, comment: 'Manager approve' })
  approved_by: number | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'bigint', nullable: true })
  created_by: number | null;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @Column({ type: 'bigint', nullable: true })
  updated_by: number | null;
}
