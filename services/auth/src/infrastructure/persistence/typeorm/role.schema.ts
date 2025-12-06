import { EntitySchema } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';

export const RoleSchema = new EntitySchema<RoleEntity>({
  name: 'Role',
  tableName: 'roles',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    code: { type: 'varchar', length: 100, unique: true },
    name: { type: 'varchar', length: 255 },
    description: { type: 'text', nullable: true },
    level: {
      type: 'int',
      comment: '1=SUPER_ADMIN, 2=HR_ADMIN, 3=HR_STAFF, 4=MANAGER, 5=EMPLOYEE',
    },
    is_system_role: { type: 'boolean', default: false },
    status: { type: 'varchar', length: 20, default: 'active' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
    created_by: { type: 'bigint', nullable: true },
    updated_by: { type: 'bigint', nullable: true },
  },
  indices: [
    { name: 'idx_roles_code', columns: ['code'] },
    { name: 'idx_roles_status', columns: ['status'] },
    { name: 'idx_roles_level', columns: ['level'] },
  ],
});
