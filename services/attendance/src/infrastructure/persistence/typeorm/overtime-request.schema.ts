import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('overtime_requests')
@Index(['employee_id'])
@Index(['status'])
@Index(['overtime_date'])
export class OvertimeRequestSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  employee_id: number;

  @Column({ type: 'int', nullable: true })
  shift_id: number | null;

  @Column({ type: 'date' })
  overtime_date: Date;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  estimated_hours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  actual_hours: number | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  status: string;

  @CreateDateColumn()
  requested_at: Date;

  @Column({ type: 'bigint', nullable: true })
  requested_by: number | null;

  @Column({ type: 'bigint', nullable: true })
  approved_by: number | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'bigint', nullable: true })
  created_by: number | null;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'bigint', nullable: true })
  updated_by: number | null;
}
