import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PresenceVerificationRoundEntity } from '../../../domain/entities/presence-verification-round.entity';

@Entity('presence_verification_rounds')
@Index(['shift_id', 'round_number'])
@Index(['employee_id', 'captured_at'])
export class PresenceVerificationRoundSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  shift_id: number;

  @Column({ type: 'int' })
  employee_id: number;

  @Column({ type: 'int' })
  round_number: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  location_accuracy?: number;

  @Column({ type: 'boolean', default: false })
  is_valid: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_from_office_meters?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_from_check_in_meters?: number;

  @Column({ type: 'varchar', length: 20 })
  validation_status: string;

  @Column({ type: 'text', nullable: true })
  validation_reason?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id?: string;

  @Column({ type: 'int', nullable: true })
  battery_level?: number;

  @Column({ type: 'timestamp' })
  captured_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  static fromDomain(
    entity: PresenceVerificationRoundEntity,
  ): PresenceVerificationRoundSchema {
    const schema = new PresenceVerificationRoundSchema();
    if (entity.id) schema.id = Number(entity.id);
    schema.shift_id = Number(entity.shift_id);
    schema.employee_id = Number(entity.employee_id);
    schema.round_number = entity.round_number;
    schema.latitude = entity.latitude;
    schema.longitude = entity.longitude;
    schema.location_accuracy = entity.location_accuracy;
    schema.is_valid = entity.is_valid;
    schema.distance_from_office_meters =
      entity.distance_from_office_meters ?? undefined;
    schema.distance_from_check_in_meters =
      entity.distance_from_check_in_meters ?? undefined;
    schema.validation_status = entity.validation_status;
    schema.validation_reason = entity.validation_reason;
    schema.device_id = entity.device_id;
    schema.battery_level = entity.battery_level;
    schema.captured_at = entity.captured_at;
    return schema;
  }

  toDomain(): PresenceVerificationRoundEntity {
    return new PresenceVerificationRoundEntity({
      id: this.id,
      shift_id: this.shift_id,
      employee_id: this.employee_id,
      round_number: this.round_number,
      latitude: this.latitude,
      longitude: this.longitude,
      location_accuracy: this.location_accuracy,
      is_valid: this.is_valid,
      distance_from_office_meters: this.distance_from_office_meters,
      distance_from_check_in_meters: this.distance_from_check_in_meters,
      validation_status: this.validation_status as any,
      validation_reason: this.validation_reason,
      device_id: this.device_id,
      battery_level: this.battery_level,
      captured_at: this.captured_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    });
  }
}
