import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  ScheduledNotification,
  ScheduledNotificationStatus,
} from '../../domain/entities/scheduled-notification.entity';
import { ScheduledNotificationRepositoryPort } from '../../application/ports/scheduled-notification.repository.port';
import { ScheduledNotificationSchema } from './typeorm/schemas/scheduled-notification.schema';
import { ScheduledNotificationMapper } from './typeorm/mappers/scheduled-notification.mapper';

@Injectable()
export class PostgresScheduledNotificationRepository implements ScheduledNotificationRepositoryPort {
  private readonly logger = new Logger(PostgresScheduledNotificationRepository.name);

  constructor(
    @InjectRepository(ScheduledNotificationSchema)
    private readonly repository: Repository<ScheduledNotificationSchema>,
  ) {}

  async create(scheduled: ScheduledNotification): Promise<ScheduledNotification> {
    const schema = ScheduledNotificationMapper.toSchema(scheduled);
    const saved = await this.repository.save(schema);
    this.logger.log(`Created scheduled notification with ID ${saved.id}`);
    return ScheduledNotificationMapper.toDomain(saved);
  }

  async findById(id: number): Promise<ScheduledNotification | null> {
    const schema = await this.repository.findOne({ where: { id } });
    return schema ? ScheduledNotificationMapper.toDomain(schema) : null;
  }

  async findDueNotifications(): Promise<ScheduledNotification[]> {
    const now = new Date();
    const schemas = await this.repository
      .createQueryBuilder('scheduled')
      .where('scheduled.status = :status', { status: ScheduledNotificationStatus.ACTIVE })
      .andWhere('scheduled.next_run_at <= :now', { now })
      .orderBy('scheduled.next_run_at', 'ASC')
      .getMany();

    this.logger.log(`Found ${schemas.length} due scheduled notifications`);
    return schemas.map(ScheduledNotificationMapper.toDomain);
  }

  async findByCreator(
    creatorId: number,
    options?: {
      limit?: number;
      offset?: number;
      status?: ScheduledNotificationStatus;
    },
  ): Promise<ScheduledNotification[]> {
    const query = this.repository
      .createQueryBuilder('scheduled')
      .where('scheduled.created_by = :creatorId', { creatorId })
      .orderBy('scheduled.created_at', 'DESC');

    if (options?.status) {
      query.andWhere('scheduled.status = :status', { status: options.status });
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    const schemas = await query.getMany();
    return schemas.map(ScheduledNotificationMapper.toDomain);
  }

  async findActive(): Promise<ScheduledNotification[]> {
    const schemas = await this.repository.find({
      where: { status: ScheduledNotificationStatus.ACTIVE },
      order: { next_run_at: 'ASC' },
    });
    return schemas.map(ScheduledNotificationMapper.toDomain);
  }

  async update(scheduled: ScheduledNotification): Promise<ScheduledNotification> {
    const schema = ScheduledNotificationMapper.toSchema(scheduled);
    const updated = await this.repository.save(schema);
    this.logger.log(`Updated scheduled notification with ID ${updated.id}`);
    return ScheduledNotificationMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
    this.logger.log(`Deleted scheduled notification with ID ${id}`);
  }

  async countByCreator(creatorId: number, status?: ScheduledNotificationStatus): Promise<number> {
    const query = this.repository
      .createQueryBuilder('scheduled')
      .where('scheduled.created_by = :creatorId', { creatorId });

    if (status) {
      query.andWhere('scheduled.status = :status', { status });
    }

    return query.getCount();
  }
}
