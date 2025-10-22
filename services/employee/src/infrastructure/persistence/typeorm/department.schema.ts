import { EntitySchema } from 'typeorm';
import { Department } from '../../../domain/entities/department.entity';

export const DepartmentSchema = new EntitySchema<Department>({
  name: 'Department',
  tableName: 'departments',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    department_code: { type: 'varchar', length: 50, unique: true },
    department_name: { type: 'varchar', length: 100 },
    description: { type: 'text', nullable: true },
    parent_department_id: { type: 'int', nullable: true },
    level: { type: 'int', default: 1 },
    path: { type: 'varchar', length: 255, nullable: true },
    manager_id: { type: 'bigint', nullable: true },
    office_address: { type: 'varchar', length: 255, nullable: true },
    office_latitude: { type: 'decimal', precision: 10, scale: 8, nullable: true },
    office_longitude: { type: 'decimal', precision: 11, scale: 8, nullable: true },
    office_radius_meters: { type: 'int', default: 100 },
    status: { type: 'varchar', length: 20, default: 'ACTIVE' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true }
  },
  relations: {
    parent: {
      type: 'many-to-one',
      target: 'Department',
      joinColumn: {
        name: 'parent_department_id',
        referencedColumnName: 'id'
      }
    }
  }
});