import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { EmployeeShiftEntity } from './employee-shift.entity';

/**
 * PresenceVerificationRoundEntity - GPS verification rounds trong ca làm việc
 * 
 * Purpose:
 * - Verify nhân viên vẫn ở văn phòng trong suốt ca làm việc
 * - Chống gian lận: check-in rồi rời đi
 * - Yêu cầu capture GPS định kỳ (mỗi 2-3 giờ)
 */
@Entity('presence_verification_rounds')
@Index(['shift_id', 'round_number'], { unique: true })
@Index(['shift_id'])
@Index(['employee_id', 'captured_at'])
export class PresenceVerificationRoundEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ comment: 'References employee_shifts.id' })
  shift_id: number;

  @ManyToOne(() => EmployeeShiftEntity)
  @JoinColumn({ name: 'shift_id' })
  shift: EmployeeShiftEntity;

  @Column({ type: 'bigint', comment: 'References employee_db.employees.id' })
  employee_id: number;

  @Column({ comment: 'Lượt verification thứ mấy trong ca (1, 2, 3...)' })
  round_number: number;

  // GPS Data
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'GPS accuracy in meters' })
  location_accuracy: number | null;

  // Validation
  @Column({ type: 'boolean', default: false })
  is_valid: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Khoảng cách từ văn phòng (meters)' })
  distance_from_office_meters: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Khoảng cách từ vị trí check-in (meters)' })
  distance_from_check_in_meters: number | null;

  // Device Info
  @Column({ type: 'varchar', length: 255, nullable: true })
  device_id: string | null;

  @Column({ type: 'int', nullable: true, comment: 'Battery % when captured' })
  battery_level: number | null;

  @Column({ type: 'timestamptz', comment: 'Thời điểm capture GPS' })
  captured_at: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'VALID, INVALID, OUT_OF_RANGE, SUSPICIOUS' })
  validation_status: string | null;

  @Column({ type: 'text', nullable: true })
  validation_reason: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
