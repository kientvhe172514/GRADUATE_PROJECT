import { EntitySchema } from 'typeorm';
import { RolePermissionEntity } from '../entities/role-permission.entity';

export const RolePermissionSchema = new EntitySchema<RolePermissionEntity>({
  name: 'RolePermission',
  tableName: 'role_permissions',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    role_id: { type: 'int' },
    permission_id: { type: 'int' },
    created_at: { type: 'timestamp', createDate: true },
    created_by: { type: 'bigint', nullable: true },
  },
  indices: [
    { name: 'idx_role_permissions_role_id', columns: ['role_id'] },
    { name: 'idx_role_permissions_permission_id', columns: ['permission_id'] },
    {
      name: 'idx_role_permissions_unique',
      columns: ['role_id', 'permission_id'],
      unique: true,
    },
  ],
});
