import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('violations')
@Index(['employee_id'])
@Index(['shift_id'])
@Index(['violation_type'])
@Index(['detected_at'])
export class ViolationSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  @Index()
  employee_id: number;

  @Column({ type: 'int', nullable: true })
  shift_id: number | null;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  violation_type: string;

  @Column({ type: 'varchar', length: 20 })
  severity: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  evidence_data: any;

  @CreateDateColumn()
  @Index()
  detected_at: Date;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ type: 'bigint', nullable: true })
  resolved_by: number | null;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date | null;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'bigint', nullable: true })
  created_by: number | null;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'bigint', nullable: true })
  updated_by: number | null;
}
