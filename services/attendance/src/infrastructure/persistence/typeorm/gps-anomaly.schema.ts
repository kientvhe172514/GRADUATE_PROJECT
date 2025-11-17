import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { GpsAnomalyEntity } from '../../../domain/entities/gps-anomaly.entity';

@Entity('gps_anomaly_detections')
@Index(['employee_id', 'detected_at'])
@Index(['shift_id'])
@Index(['anomaly_type', 'severity'])
export class GpsAnomalySchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  employee_id: number;

  @Column({ type: 'int', nullable: true })
  shift_id?: number;

  @Column({ type: 'varchar', length: 50 })
  anomaly_type: string;

  @Column({ type: 'varchar', length: 20 })
  severity: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence_data?: Record<string, any>;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp' })
  detected_at: Date;

  @Column({ type: 'boolean', default: false })
  auto_flagged: boolean;

  @Column({ type: 'boolean', default: false })
  notified: boolean;

  @Column({ type: 'boolean', default: false })
  requires_investigation: boolean;

  @Column({ type: 'int', nullable: true })
  investigated_by?: number;

  @Column({ type: 'timestamp', nullable: true })
  investigated_at?: Date;

  @Column({ type: 'text', nullable: true })
  investigation_notes?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  investigation_result?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  static fromDomain(entity: GpsAnomalyEntity): GpsAnomalySchema {
    const schema = new GpsAnomalySchema();
    if (entity.id) schema.id = Number(entity.id);
    schema.employee_id = Number(entity.employee_id);
    if (entity.shift_id) schema.shift_id = Number(entity.shift_id);
    schema.anomaly_type = entity.anomaly_type;
    schema.severity = entity.severity;
    schema.evidence_data = entity.evidence_data;
    schema.description = entity.description;
    schema.detected_at = entity.detected_at;
    schema.auto_flagged = entity.auto_flagged ?? false;
    schema.notified = entity.notified ?? false;
    schema.requires_investigation = entity.requires_investigation ?? false;
    if (entity.investigated_by)
      schema.investigated_by = Number(entity.investigated_by);
    schema.investigated_at = entity.investigated_at;
    schema.investigation_notes = entity.investigation_notes;
    schema.investigation_result = entity.investigation_result;
    return schema;
  }

  toDomain(): GpsAnomalyEntity {
    return new GpsAnomalyEntity({
      id: this.id,
      employee_id: this.employee_id,
      shift_id: this.shift_id,
      anomaly_type: this.anomaly_type as any,
      severity: this.severity as any,
      evidence_data: this.evidence_data,
      description: this.description,
      detected_at: this.detected_at,
      auto_flagged: this.auto_flagged,
      notified: this.notified,
      requires_investigation: this.requires_investigation,
      investigated_by: this.investigated_by,
      investigated_at: this.investigated_at,
      investigation_notes: this.investigation_notes,
      investigation_result: this.investigation_result as any,
      created_at: this.created_at,
      updated_at: this.updated_at,
    });
  }
}
