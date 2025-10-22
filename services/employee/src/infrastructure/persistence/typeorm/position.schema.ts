import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('positions')
export class PositionSchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'position_code', unique: true })
  position_code: string;

  @Column({ name: 'position_name' })
  position_name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  level: number;

  @Column({ name: 'department_id', nullable: true })
  department_id?: number;

  @Column({ name: 'suggested_role', nullable: true })
  suggested_role?: string;

  @Column({ name: 'salary_min', nullable: true })
  salary_min?: number;

  @Column({ name: 'salary_max', nullable: true })
  salary_max?: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
