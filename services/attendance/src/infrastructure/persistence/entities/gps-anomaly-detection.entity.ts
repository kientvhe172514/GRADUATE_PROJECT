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
 * GpsAnomalyDetectionEntity - Phát hiện gian lận GPS
 *
 * Anomaly Types:
 * - TELEPORTATION: Di chuyển quá nhanh (> 100km/h)
 * - OUT_OF_RANGE: Quá xa văn phòng trong ca làm
 * - GPS_SPOOFING: Fake GPS location
 * - IMPOSSIBLE_SPEED: Tốc độ di chuyển không hợp lý
 */
@Entity('gps_anomaly_detections')
@Index(['employee_id'])
@Index(['detected_at'])
@Index(['requires_investigation', 'detected_at'])
export class GpsAnomalyDetectionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', comment: 'References employee_db.employees.id' })
  employee_id: number;

  @Column({
    nullable: true,
    comment: 'References employee_shifts.id nếu xảy ra trong ca',
  })
  shift_id: number | null;

  @ManyToOne(() => EmployeeShiftEntity, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: EmployeeShiftEntity | null;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'TELEPORTATION, OUT_OF_RANGE, GPS_SPOOFING, IMPOSSIBLE_SPEED',
  })
  anomaly_type: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'LOW, MEDIUM, HIGH, CRITICAL',
  })
  severity: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Chi tiết bằng chứng: locations, speeds, timestamps...',
  })
  evidence_data: object | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz', comment: 'Thời điểm phát hiện anomaly' })
  detected_at: Date;

  // Auto flagging
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Auto-detected bởi algorithm',
  })
  auto_flagged: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Đã notify HR/Manager chưa',
  })
  notified: boolean;

  @Column({ type: 'boolean', default: false, comment: 'Cần điều tra thủ công' })
  requires_investigation: boolean;

  // Investigation tracking
  @Column({ type: 'bigint', nullable: true, comment: 'HR/Manager điều tra' })
  investigated_by: number | null;

  @Column({ type: 'timestamp', nullable: true })
  investigated_at: Date | null;

  @Column({ type: 'text', nullable: true })
  investigation_notes: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'CONFIRMED_FRAUD, FALSE_POSITIVE, TECHNICAL_ERROR',
  })
  investigation_result: string | null;
}
