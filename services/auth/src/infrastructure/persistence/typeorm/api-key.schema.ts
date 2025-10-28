import { EntitySchema } from 'typeorm';
import { ApiKeyEntity } from '../entities/api-key.entity';

export const ApiKeySchema = new EntitySchema<ApiKeyEntity>({
  name: 'ApiKey',
  tableName: 'api_keys',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    key_hash: { type: 'varchar', length: 255, unique: true },
    service_name: { type: 'varchar', length: 255 },
    description: { type: 'text', nullable: true },
    status: { type: 'varchar', length: 20, default: 'active' },
    allowed_ips: { type: 'simple-array', nullable: true },
    rate_limit_per_hour: { type: 'int', nullable: true },
    permissions: { type: 'simple-array', default: '' },
    scope_constraints: { type: 'jsonb', nullable: true },
    last_used_at: { type: 'timestamp', nullable: true },
    last_used_ip: { type: 'varchar', length: 45, nullable: true },
    usage_count: { type: 'bigint', default: 0 },
    expires_at: { type: 'timestamp', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
    created_by: { type: 'bigint', nullable: true },
    updated_by: { type: 'bigint', nullable: true },
    revoked_at: { type: 'timestamp', nullable: true },
    revoked_by: { type: 'bigint', nullable: true },
  },
  indices: [
    { name: 'idx_api_keys_key_hash', columns: ['key_hash'] },
    { name: 'idx_api_keys_service_name', columns: ['service_name'] },
    { name: 'idx_api_keys_status', columns: ['status'] },
    { name: 'idx_api_keys_expires_at', columns: ['expires_at'] },
  ],
});
