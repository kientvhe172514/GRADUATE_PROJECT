import { EntitySchema } from 'typeorm';
import { PermissionEntity } from '../entities/permission.entity';

export const PermissionSchema = new EntitySchema<PermissionEntity>({
  name: 'Permission',
  tableName: 'permissions',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    code: { type: 'varchar', length: 255, unique: true },
    resource: { type: 'varchar', length: 100 },
    action: { type: 'varchar', length: 100 },
    scope: { type: 'varchar', length: 50, nullable: true },
    description: { type: 'text', nullable: true },
    is_system_permission: { type: 'boolean', default: false },
    status: { type: 'varchar', length: 20, default: 'active' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
    created_by: { type: 'bigint', nullable: true },
    updated_by: { type: 'bigint', nullable: true },
  },
  indices: [
    { name: 'idx_permissions_code', columns: ['code'] },
    { name: 'idx_permissions_resource', columns: ['resource'] },
    { name: 'idx_permissions_status', columns: ['status'] },
  ],
});
