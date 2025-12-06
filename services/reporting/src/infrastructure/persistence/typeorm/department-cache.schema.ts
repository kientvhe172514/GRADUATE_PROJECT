import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * departments_cache table
 * 
 * Cache of department data for fast lookups in reporting
 * Synced from Employee Service via department.* events
 * 
 * Note: Departments are never deleted, only marked INACTIVE
 * This preserves historical data integrity
 */
@Entity('departments_cache')
export class DepartmentCache {
  @PrimaryColumn({ name: 'department_id', type: 'bigint' })
  departmentId: number;

  @Column({ name: 'department_name', type: 'varchar', length: 255, nullable: false })
  departmentName: string;

  @Column({ name: 'department_code', type: 'varchar', length: 50, nullable: true })
  departmentCode: string;

  @Column({ name: 'manager_id', type: 'bigint', nullable: true })
  managerId: number;

  @Column({ name: 'parent_department_id', type: 'bigint', nullable: true })
  parentDepartmentId: number;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
