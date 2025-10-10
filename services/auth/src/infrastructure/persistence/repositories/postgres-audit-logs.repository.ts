import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsSchema } from '../typeorm/audit-logs.schema';
import { AuditLogsRepositoryPort } from '../../../application/ports/audit-logs.repository.port';
import { AuditLogs } from '../../../domain/entities/audit-logs.entity';
import { AuditLogsEntity } from '../entities/audit-logs.entity';
import { AuditLogsMapper } from '../mappers/audit-logs.mapper';

@Injectable()
export class PostgresAuditLogsRepository implements AuditLogsRepositoryPort {
  constructor(
    @InjectRepository(AuditLogsSchema)
    private repository: Repository<AuditLogsEntity>,
  ) {}

  async create(auditLog: AuditLogs): Promise<AuditLogs> {
    const entity = AuditLogsMapper.toPersistence(auditLog);
    const savedEntity = await this.repository.save(entity);
    return AuditLogsMapper.toDomain(savedEntity);
  }

  async findByAccountId(accountId: number, limit: number = 100): Promise<AuditLogs[]> {
    const entities = await this.repository.find({
      where: { account_id: accountId },
      order: { created_at: 'DESC' },
      take: limit,
    });
    return entities.map(AuditLogsMapper.toDomain);
  }

  async findByAction(action: string, limit: number = 100): Promise<AuditLogs[]> {
    const entities = await this.repository.find({
      where: { action },
      order: { created_at: 'DESC' },
      take: limit,
    });
    return entities.map(AuditLogsMapper.toDomain);
  }

  async findByDateRange(startDate: Date, endDate: Date, limit: number = 100): Promise<AuditLogs[]> {
    const entities = await this.repository
      .createQueryBuilder('audit_logs')
      .where('audit_logs.created_at >= :startDate', { startDate })
      .andWhere('audit_logs.created_at <= :endDate', { endDate })
      .orderBy('audit_logs.created_at', 'DESC')
      .limit(limit)
      .getMany();
    
    return entities.map(AuditLogsMapper.toDomain);
  }

  async findByAccountAndAction(accountId: number, action: string, limit: number = 100): Promise<AuditLogs[]> {
    const entities = await this.repository.find({
      where: { account_id: accountId, action },
      order: { created_at: 'DESC' },
      take: limit,
    });
    return entities.map(AuditLogsMapper.toDomain);
  }

  async deleteOldLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();
    
    return result.affected || 0;
  }
}
