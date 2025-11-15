import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('attendance_check_records')
@Index(['employee_id', 'check_timestamp'])
@Index(['check_timestamp'])
export class AttendanceCheckRecordSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  employee_id: number;

  @Column({ type: 'varchar', length: 50 })
  employee_code: string;

  @Column({ type: 'integer' })
  department_id: number;

  @Column({ type: 'timestamptz' })
  check_timestamp: Date;

  @Column({ type: 'varchar', length: 20 })
  check_type: string; // CHECK_IN, CHECK_OUT, BREAK_START, BREAK_END

  // Beacon validation
  @Column({ type: 'integer', nullable: true })
  beacon_id?: number;

  @Column({ type: 'boolean', default: false })
  beacon_validated: boolean;

  @Column({ type: 'integer', nullable: true })
  beacon_rssi?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  beacon_distance_meters?: number;

  // GPS validation
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  location_accuracy?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location_name?: string;

  @Column({ type: 'boolean', default: false })
  gps_validated: boolean;

  @Column({ type: 'decimal', precision: 7, scale: 2, nullable: true })
  distance_from_office_meters?: number;

  // Device info
  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  device_info?: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address?: string;

  // Face verification
  @Column({ type: 'varchar', length: 500, nullable: true })
  photo_url?: string;

  @Column({ type: 'boolean', default: false })
  face_verified: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  face_confidence?: number;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at?: Date;

  // Overall validation
  @Column({ type: 'boolean', default: false })
  is_valid: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validation_errors?: any;

  // Manual correction tracking
  @Column({ type: 'boolean', default: false })
  is_manually_corrected: boolean;

  @Column({ type: 'text', nullable: true })
  correction_reason?: string;

  @Column({ type: 'integer', nullable: true })
  corrected_by?: number;

  @Column({ type: 'timestamptz', nullable: true })
  corrected_at?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
