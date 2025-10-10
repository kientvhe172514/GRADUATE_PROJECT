import { AuditLogs } from '../../domain/entities/audit-logs.entity';

export interface AuditLogsRepositoryPort {
  create(auditLog: AuditLogs): Promise<AuditLogs>;
  findByAccountId(accountId: number, limit?: number): Promise<AuditLogs[]>;
  findByAction(action: string, limit?: number): Promise<AuditLogs[]>;
  findByDateRange(startDate: Date, endDate: Date, limit?: number): Promise<AuditLogs[]>;
  findByAccountAndAction(accountId: number, action: string, limit?: number): Promise<AuditLogs[]>;
  deleteOldLogs(olderThanDays: number): Promise<number>;
}
