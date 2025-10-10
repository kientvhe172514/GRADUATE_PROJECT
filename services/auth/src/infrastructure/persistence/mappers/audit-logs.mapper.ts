import { AuditLogs } from '../../../domain/entities/audit-logs.entity';
import { AuditLogsEntity } from '../entities/audit-logs.entity';

export class AuditLogsMapper {
  static toDomain(entity: AuditLogsEntity): AuditLogs {
    const auditLog = new AuditLogs();
    auditLog.id = entity.id;
    auditLog.account_id = entity.account_id;
    auditLog.action = entity.action;
    auditLog.ip_address = entity.ip_address;
    auditLog.user_agent = entity.user_agent;
    auditLog.success = entity.success;
    auditLog.error_message = entity.error_message;
    auditLog.metadata = entity.metadata;
    auditLog.created_at = entity.created_at;
    return auditLog;
  }

  static toPersistence(auditLog: AuditLogs): AuditLogsEntity {
    const entity = new AuditLogsEntity();
    entity.id = auditLog.id;
    entity.account_id = auditLog.account_id;
    entity.action = auditLog.action;
    entity.ip_address = auditLog.ip_address;
    entity.user_agent = auditLog.user_agent;
    entity.success = auditLog.success;
    entity.error_message = auditLog.error_message;
    entity.metadata = auditLog.metadata;
    entity.created_at = auditLog.created_at;
    return entity;
  }
}
