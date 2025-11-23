import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Employee Cache Schema
 * 
 * Denormalized cache of employee data from Employee Service
 * Updated via RabbitMQ events when employee data changes
 * Used for reporting and dashboard queries to avoid cross-service joins
 */
@Entity('employee_cache')
@Index(['status'])
@Index(['department_id'])
@Index(['role_name'])
export class EmployeeCacheSchema {
  @PrimaryColumn({ type: 'integer' })
  employee_id: number;

  @Column({ type: 'varchar', length: 50 })
  employee_code: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'integer', nullable: true })
  department_id?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  department_name?: string;

  @Column({ type: 'integer', nullable: true })
  position_id?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  position_name?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  role_name?: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active, inactive, terminated

  @Column({ type: 'date', nullable: true })
  join_date?: Date;

  @Column({ type: 'date', nullable: true })
  termination_date?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url?: string;

  @Column({ type: 'boolean', default: false })
  face_id_registered: boolean;

  @Column({ type: 'boolean', default: false })
  face_id_pending_verification: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employment_type?: string; // FULL_TIME, PART_TIME, CONTRACT, INTERN

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_synced_at?: Date;
}
