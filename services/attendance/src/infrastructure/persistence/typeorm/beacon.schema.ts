import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity('beacons')
@Index(['beacon_uuid', 'beacon_major', 'beacon_minor'], { unique: true })
export class BeaconSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  beacon_uuid: string;

  @Column({ type: 'integer' })
  beacon_major: number;

  @Column({ type: 'integer' })
  beacon_minor: number;

  @Column({ type: 'varchar', length: 100 })
  beacon_name: string;

  @Column({ type: 'integer' })
  department_id: number;

  @Column({ type: 'varchar', length: 200 })
  location_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  floor?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  building?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  room_number?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  signal_range_meters: number;

  @Column({ type: 'integer', default: -70 })
  rssi_threshold: number;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'integer', nullable: true })
  battery_level?: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_heartbeat_at?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'integer', nullable: true })
  created_by?: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'integer', nullable: true })
  updated_by?: number;
}
