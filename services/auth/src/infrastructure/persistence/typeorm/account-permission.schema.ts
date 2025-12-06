import { EntitySchema } from 'typeorm';
import { AccountPermissionEntity } from '../entities/account-permission.entity';

export const AccountPermissionSchema =
  new EntitySchema<AccountPermissionEntity>({
    name: 'AccountPermission',
    tableName: 'account_permissions',
    columns: {
      id: { type: 'int', primary: true, generated: true },
      account_id: { type: 'bigint' },
      permission_id: { type: 'int' },
      is_granted: { type: 'boolean', default: true },
      scope_constraints: { type: 'jsonb', nullable: true },
      created_at: { type: 'timestamp', createDate: true },
      updated_at: { type: 'timestamp', updateDate: true },
      created_by: { type: 'bigint', nullable: true },
      updated_by: { type: 'bigint', nullable: true },
    },
    indices: [
      { name: 'idx_account_permissions_account_id', columns: ['account_id'] },
      {
        name: 'idx_account_permissions_permission_id',
        columns: ['permission_id'],
      },
      {
        name: 'idx_account_permissions_unique',
        columns: ['account_id', 'permission_id'],
        unique: true,
      },
    ],
  });
