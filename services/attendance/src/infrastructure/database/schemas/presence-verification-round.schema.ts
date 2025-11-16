import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PresenceVerificationRoundEntity } from '../../../domain/entities/presence-verification-round.entity';

/**
 * TypeORM Schema for Presence Verification Rounds
 * 
 * Indexes:
 * - shift_id: Fast lookups for shift verifications
 * - employee_id: Fast lookups for employee history
 * - (shift_id, round_number): Unique constraint to prevent duplicate rounds
 * - captured_at: For date range queries
 */
@Entity('presence_verification_rounds')
@Index(['shift_id'])
@Index(['employee_id'])
@Index(['shift_id', 'round_number'], { unique: true })
@Index(['captured_at'])
export class PresenceVerificationRoundSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string | undefined;

  @Column({ type: 'uuid' })
  @Index()
  shift_id: string;

  @Column({ type: 'uuid' })
  @Index()
  employee_id: string;

  @Column({ type: 'int' })
  round_number: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  location_accuracy: number | null;

  @Column({ type: 'boolean', default: true })
  is_valid: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_from_office_meters: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_from_checkin_meters: number | null;

  @Column({ 
    type: 'enum', 
    enum: ['VALID', 'OUT_OF_RANGE', 'SUSPICIOUS'],
    default: 'VALID'
  })
  validation_status: string;

  @Column({ type: 'text', nullable: true })
  validation_notes: string | null;

  @Column({ type: 'int', nullable: true })
  battery_level: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id: string | null;

  @CreateDateColumn()
  captured_at: Date;

  /**
   * Convert TypeORM entity to Domain entity
   */
  toDomain(): PresenceVerificationRoundEntity {
    return new PresenceVerificationRoundEntity({
      id: Number(this.id),
      shift_id: Number(this.shift_id),
      employee_id: Number(this.employee_id),
      round_number: this.round_number,
      latitude: Number(this.latitude),
      longitude: Number(this.longitude),
      location_accuracy: this.location_accuracy ? Number(this.location_accuracy) : undefined,
      is_valid: this.is_valid,
      distance_from_office_meters: this.distance_from_office_meters ? Number(this.distance_from_office_meters) : null,
      distance_from_check_in_meters: this.distance_from_checkin_meters ? Number(this.distance_from_checkin_meters) : null,
      validation_status: this.validation_status as any,
      validation_reason: this.validation_notes ?? undefined,
      battery_level: this.battery_level ?? undefined,
      device_id: this.device_id ?? undefined,
      captured_at: this.captured_at,
    });
  }

  /**
   * Create TypeORM entity from Domain entity
   */
  static fromDomain(domain: PresenceVerificationRoundEntity): PresenceVerificationRoundSchema {
    const schema = new PresenceVerificationRoundSchema();
    schema.id = domain.id ? String(domain.id) : undefined;
    schema.shift_id = String(domain.shift_id);
    schema.employee_id = String(domain.employee_id);
    schema.round_number = domain.round_number;
    schema.latitude = domain.latitude;
    schema.longitude = domain.longitude;
    schema.location_accuracy = domain.location_accuracy ?? null;
    schema.is_valid = domain.is_valid;
    schema.distance_from_office_meters = domain.distance_from_office_meters ?? null;
    schema.distance_from_checkin_meters = domain.distance_from_check_in_meters ?? null;
    schema.validation_status = domain.validation_status;
    schema.validation_notes = domain.validation_reason ?? null;
    schema.battery_level = domain.battery_level ?? null;
    schema.device_id = domain.device_id ?? null;
    schema.captured_at = domain.captured_at;
    return schema;
  }
}
