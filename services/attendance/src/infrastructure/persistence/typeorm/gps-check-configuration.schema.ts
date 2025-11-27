import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('gps_check_configurations')
@Index(['shift_type', 'is_active'])
@Index(['is_default', 'is_active'])
@Index(['priority', 'is_active'])
export class GpsCheckConfigurationSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  config_name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'REGULAR',
    comment: 'REGULAR, OVERTIME, ALL',
  })
  shift_type: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'INTERVAL_BASED',
    comment: 'INTERVAL_BASED, FIXED_COUNT, DURATION_BASED, RANDOM',
  })
  check_strategy: string;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 2.5,
    comment: 'Check every X hours',
  })
  check_interval_hours: number;

  @Column({ type: 'int', default: 2, comment: 'Minimum checks per shift' })
  min_checks_per_shift: number;

  @Column({ type: 'int', default: 12, comment: 'Maximum checks per shift' })
  max_checks_per_shift: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Add random offset to scheduled times',
  })
  enable_random_timing: boolean;

  @Column({
    type: 'int',
    default: 15,
    comment: 'Random offset in minutes (±)',
  })
  random_offset_minutes: number;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 4.0,
    comment: 'Minimum shift duration to apply this config',
  })
  min_shift_duration_hours: number;

  @Column({
    type: 'int',
    default: 3,
    comment: 'Default number of checks for FIXED_COUNT strategy',
  })
  default_checks_count: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Only one can be default per shift_type',
  })
  is_default: boolean;

  @Column({ type: 'int', default: 0, comment: 'Higher = preferred' })
  priority: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  created_by?: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by?: number;
}
