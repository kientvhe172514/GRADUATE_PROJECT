import { EntitySchema } from 'typeorm';

export interface RoleCacheEntity {
  id: number;
  role_id: number;
  code: string;
  name: string;
  level: number;
  status: string;
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

export const RoleCacheSchema = new EntitySchema<RoleCacheEntity>({
  name: 'RoleCache',
  tableName: 'roles_cache',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    role_id: {
      type: 'int',
      nullable: false,
      unique: true,
      comment: 'References roles.id from auth_db',
    },
    code: {
      type: 'varchar',
      length: 50,
      nullable: false,
    },
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    level: {
      type: 'int',
      nullable: false,
      default: 0,
    },
    status: {
      type: 'varchar',
      length: 20,
      default: 'ACTIVE',
    },
    synced_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  indices: [
    {
      name: 'idx_roles_cache_role_id',
      columns: ['role_id'],
    },
    {
      name: 'idx_roles_cache_code',
      columns: ['code'],
    },
    {
      name: 'idx_roles_cache_status',
      columns: ['status'],
    },
  ],
});
