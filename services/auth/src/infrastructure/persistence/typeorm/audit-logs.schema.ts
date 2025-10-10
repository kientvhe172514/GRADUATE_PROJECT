import { EntitySchema } from 'typeorm';
import { AuditLogsEntity } from '../entities/audit-logs.entity';

export const AuditLogsSchema = new EntitySchema<AuditLogsEntity>({
  name: 'AuditLogs',
  tableName: 'audit_logs',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    account_id: { type: 'bigint', nullable: true },
    action: { type: 'varchar', length: 100 },
    ip_address: { type: 'varchar', length: 45, nullable: true },
    user_agent: { type: 'text', nullable: true },
    success: { type: 'boolean' },
    error_message: { type: 'text', nullable: true },
    metadata: { type: 'jsonb', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
  },
  indices: [
    {
      name: 'idx_audit_logs_account_created',
      columns: ['account_id', 'created_at'],
    },
    {
      name: 'idx_audit_logs_action_created',
      columns: ['action', 'created_at'],
    },
    {
      name: 'idx_audit_logs_created_at',
      columns: ['created_at'],
    },
  ],
});
