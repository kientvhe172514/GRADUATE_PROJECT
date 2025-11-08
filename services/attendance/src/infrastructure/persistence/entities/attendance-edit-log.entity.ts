import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { EmployeeShiftEntity } from './employee-shift.entity';

/**
 * AttendanceEditLogEntity - CRITICAL: Audit trail cho mọi thay đổi điểm danh
 * 
 * Purpose:
 * - Track tất cả edits của HR/Manager
 * - Compliance: Không được xóa/sửa audit logs
 * - Truy vết: Ai sửa gì, khi nào, lý do gì
 * 
 * Example Fields Changed:
 * - check_in_time, check_out_time
 * - work_hours, overtime_hours
 * - status (COMPLETED → ABSENT, etc.)
 * - late_minutes, early_leave_minutes
 */
@Entity('attendance_edit_logs')
@Index(['shift_id', 'edited_at'])
@Index(['employee_id', 'edited_at'])
@Index(['edited_by_user_id', 'edited_at'])
@Index(['edited_at'])
export class AttendanceEditLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  // Record nào bị edit
  @Column({ comment: 'Shift được edit' })
  shift_id: number;

  @ManyToOne(() => EmployeeShiftEntity)
  @JoinColumn({ name: 'shift_id' })
  shift: EmployeeShiftEntity;

  @Column({ type: 'bigint' })
  employee_id: number;

  @Column({ type: 'varchar', length: 50 })
  employee_code: string;

  @Column({ type: 'date', comment: 'Ngày ca làm việc bị sửa' })
  shift_date: Date;

  // Ai edit
  @Column({ type: 'bigint', comment: 'User ID người edit (HR/Manager)' })
  edited_by_user_id: number;

  @Column({ type: 'varchar', length: 255, comment: 'Tên người edit' })
  edited_by_user_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'HR, MANAGER, ADMIN' })
  edited_by_role: string | null;

  // Thay đổi gì
  @Column({ type: 'varchar', length: 100, comment: 'Tên field bị sửa: check_in_time, check_out_time, status, work_hours...' })
  field_changed: string;

  @Column({ type: 'text', nullable: true, comment: 'Giá trị cũ (before edit)' })
  old_value: string | null;

  @Column({ type: 'text', nullable: true, comment: 'Giá trị mới (after edit)' })
  new_value: string | null;

  // Lý do edit (từ UI)
  @Column({ type: 'text', nullable: true, comment: 'Lý do sửa điểm danh do HR nhập' })
  edit_reason: string | null;

  // Thông tin thêm
  @Column({ type: 'varchar', length: 45, nullable: true, comment: 'IP address của HR khi edit' })
  ip_address: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: 'Thời điểm sửa' })
  edited_at: Date;
}
