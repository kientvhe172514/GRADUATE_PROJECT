import { EntitySchema } from 'typeorm';
import { RefreshTokensEntity } from '../entities/refresh-tokens.entity';

export const RefreshTokensSchema = new EntitySchema<RefreshTokensEntity>({
  name: 'RefreshTokens',
  tableName: 'refresh_tokens',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    account_id: { type: 'bigint' },
    token_hash: { type: 'varchar', length: 255 },
    device_id: { type: 'varchar', length: 255, nullable: true },
    device_name: { type: 'varchar', length: 255, nullable: true },
    device_os: { type: 'varchar', length: 50, nullable: true },
    device_fingerprint: { type: 'text', nullable: true },
    device_session_id: { type: 'bigint', nullable: true },
    ip_address: { type: 'varchar', length: 45, nullable: true },
    location: { type: 'jsonb', nullable: true },
    user_agent: { type: 'text', nullable: true },
    expires_at: { type: 'timestamp' },
    revoked_at: { type: 'timestamp', nullable: true },
    last_used_at: { type: 'timestamp', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
  },
  indices: [
    {
      name: 'idx_refresh_tokens_account_id',
      columns: ['account_id'],
    },
    {
      name: 'idx_refresh_tokens_token_hash',
      columns: ['token_hash'],
    },
    {
      name: 'idx_refresh_tokens_expires_at',
      columns: ['expires_at'],
    },
    {
      name: 'idx_refresh_tokens_device_session',
      columns: ['device_session_id'],
    },
  ],
});
