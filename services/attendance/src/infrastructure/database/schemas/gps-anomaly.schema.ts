import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { GpsAnomalyEntity } from '../../../domain/entities/gps-anomaly.entity';

/**
 * TypeORM Schema for GPS Anomalies
 * 
 * Indexes:
 * - employee_id: Fast lookups for employee anomaly history
 * - shift_id: Fast lookups for shift anomalies
 * - detected_at: For date range queries
 * - (severity, requires_investigation): For filtering critical cases
 */
@Entity('gps_anomalies')
@Index(['employee_id'])
@Index(['shift_id'])
@Index(['detected_at'])
@Index(['severity', 'requires_investigation'])
export class GpsAnomalySchema {
  @PrimaryGeneratedColumn('uuid')
  id: string | undefined;

  @Column({ type: 'uuid' })
  @Index()
  employee_id: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  verification_round_id: string | null;

  @Column({ 
    type: 'enum', 
    enum: ['TELEPORTATION', 'OUT_OF_RANGE', 'GPS_SPOOFING', 'IMPOSSIBLE_SPEED']
  })
  anomaly_type: string;

  @Column({ 
    type: 'enum', 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  })
  @Index()
  severity: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  calculated_distance: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  calculated_speed_kmh: number | null;

  @Column({ type: 'boolean', default: true })
  auto_flagged: boolean;

  @Column({ type: 'boolean', default: false })
  @Index()
  requires_investigation: boolean;

  @Column({ type: 'uuid', nullable: true })
  investigated_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  investigated_at: Date | null;

  @Column({ 
    type: 'enum', 
    enum: ['LEGITIMATE', 'FRAUD_CONFIRMED', 'TECHNICAL_ERROR', 'PENDING'],
    nullable: true
  })
  investigation_result: string | null;

  @Column({ type: 'text', nullable: true })
  investigation_notes: string | null;

  @Column({ type: 'boolean', default: false })
  notified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  notified_at: Date | null;

  @CreateDateColumn()
  detected_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /**
   * Convert TypeORM entity to Domain entity
   */
  toDomain(): GpsAnomalyEntity {
    return new GpsAnomalyEntity({
      id: Number(this.id),
      employee_id: Number(this.employee_id),
      shift_id: this.shift_id ? Number(this.shift_id) : undefined,
      anomaly_type: this.anomaly_type as any,
      severity: this.severity as any,
      description: this.description,
      detected_at: this.detected_at,
      auto_flagged: this.auto_flagged,
      notified: this.notified,
      requires_investigation: this.requires_investigation,
      investigated_by: this.investigated_by ? Number(this.investigated_by) : undefined,
      investigated_at: this.investigated_at ?? undefined,
      investigation_notes: this.investigation_notes ?? undefined,
      investigation_result: (this.investigation_result as any) ?? undefined,
      created_at: this.detected_at,
      updated_at: this.updated_at,
    });
  }

  /**
   * Create TypeORM entity from Domain entity
   */
  static fromDomain(domain: GpsAnomalyEntity): GpsAnomalySchema {
    const schema = new GpsAnomalySchema();
    schema.id = domain.id ? String(domain.id) : undefined;
    schema.employee_id = String(domain.employee_id);
    schema.shift_id = domain.shift_id ? String(domain.shift_id) : null;
    schema.verification_round_id = null; // Not in domain entity
    schema.anomaly_type = domain.anomaly_type;
    schema.severity = domain.severity;
    schema.description = domain.description;
    schema.latitude = null; // Not in domain entity
    schema.longitude = null;
    schema.calculated_distance = null;
    schema.calculated_speed_kmh = null;
    schema.auto_flagged = domain.auto_flagged;
    schema.requires_investigation = domain.requires_investigation;
    schema.investigated_by = domain.investigated_by ? String(domain.investigated_by) : null;
    schema.investigated_at = domain.investigated_at ?? null;
    schema.investigation_result = domain.investigation_result ?? null;
    schema.investigation_notes = domain.investigation_notes ?? null;
    schema.notified = domain.notified;
    schema.notified_at = null; // Not in domain entity
    schema.detected_at = domain.detected_at;
    schema.updated_at = domain.updated_at ?? new Date();
    return schema;
  }
}
