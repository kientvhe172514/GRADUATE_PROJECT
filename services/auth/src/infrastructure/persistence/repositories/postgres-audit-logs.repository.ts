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

  async findByAccountId(
    accountId: number,
    limit: number = 100,
  ): Promise<AuditLogs[]> {
    const entities = await this.repository.find({
      where: { account_id: accountId },
      order: { created_at: 'DESC' },
      take: limit,
    });
    return entities.map(AuditLogsMapper.toDomain);
  }

  async findByAction(
    action: string,
    limit: number = 100,
  ): Promise<AuditLogs[]> {
    const entities = await this.repository.find({
      where: { action },
      order: { created_at: 'DESC' },
      take: limit,
    });
    return entities.map(AuditLogsMapper.toDomain);
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
  ): Promise<AuditLogs[]> {
    const entities = await this.repository
      .createQueryBuilder('audit_logs')
      .where('audit_logs.created_at >= :startDate', { startDate })
      .andWhere('audit_logs.created_at <= :endDate', { endDate })
      .orderBy('audit_logs.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return entities.map(AuditLogsMapper.toDomain);
  }

  async findByAccountAndAction(
    accountId: number,
    action: string,
    limit: number = 100,
  ): Promise<AuditLogs[]> {
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

  async findWithPagination(
    criteria: any,
  ): Promise<{ logs: AuditLogs[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('audit_log');

    // Apply filters - explicitly check for values
    if (criteria.account_id !== undefined && criteria.account_id !== null) {
      queryBuilder.andWhere('audit_log.account_id = :account_id', {
        account_id: criteria.account_id,
      });
    }

    if (
      criteria.action !== undefined &&
      criteria.action !== null &&
      criteria.action !== ''
    ) {
      queryBuilder.andWhere('audit_log.action = :action', {
        action: criteria.action,
      });
    }

    if (criteria.success !== undefined && criteria.success !== null) {
      queryBuilder.andWhere('audit_log.success = :success', {
        success: criteria.success,
      });
    }

    // Apply date filters
    if (criteria.start_date !== undefined && criteria.start_date !== null) {
      queryBuilder.andWhere('audit_log.created_at >= :start_date', {
        start_date: criteria.start_date,
      });
    }

    if (criteria.end_date !== undefined && criteria.end_date !== null) {
      queryBuilder.andWhere('audit_log.created_at <= :end_date', {
        end_date: criteria.end_date,
      });
    }

    // Apply sorting
    const sortBy = criteria.sortBy || 'created_at';
    const sortOrder = criteria.sortOrder || 'DESC';
    queryBuilder.orderBy(`audit_log.${sortBy}`, sortOrder);

    // Apply pagination
    queryBuilder.skip(criteria.offset || 0).take(criteria.limit || 10);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get logs
    const entities = await queryBuilder.getMany();
    const logs = entities.map(AuditLogsMapper.toDomain);

    return { logs, total };
  }
}
