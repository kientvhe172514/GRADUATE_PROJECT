import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import { NotificationPreferenceRepositoryPort } from '../../application/ports/notification-preference.repository.port';
import { NotificationPreferenceSchema } from './typeorm/schemas/notification-preference.schema';
import { NotificationPreferenceMapper } from './typeorm/mappers/notification-preference.mapper';
import { NotificationType } from '../../domain/enums/notification-type.enum';

@Injectable()
export class PostgresNotificationPreferenceRepository
  implements NotificationPreferenceRepositoryPort
{
  constructor(
    @InjectRepository(NotificationPreferenceSchema)
    private readonly repository: Repository<NotificationPreferenceSchema>,
  ) {}

  async findByEmployeeIdAndType(
    employeeId: number,
    type: NotificationType,
  ): Promise<NotificationPreference | null> {
    const schema = await this.repository.findOne({
      where: {
        employee_id: employeeId,
        notification_type: type,
      },
    });
    return schema ? NotificationPreferenceMapper.toDomain(schema) : null;
  }

  async upsert(
    preference: NotificationPreference,
  ): Promise<NotificationPreference> {
    const schema = NotificationPreferenceMapper.toPersistence(preference);
    const saved = await this.repository.save(schema);
    return NotificationPreferenceMapper.toDomain(saved);
  }

  async findAllByEmployeeId(
    employeeId: number,
  ): Promise<NotificationPreference[]> {
    const schemas = await this.repository.find({
      where: { employee_id: employeeId },
    });
    return schemas.map(NotificationPreferenceMapper.toDomain);
  }

  async create(
    preference: NotificationPreference,
  ): Promise<NotificationPreference> {
    const schema = NotificationPreferenceMapper.toPersistence(preference);
    const saved = await this.repository.save(schema);
    return NotificationPreferenceMapper.toDomain(saved);
  }

  async update(
    preference: NotificationPreference,
  ): Promise<NotificationPreference> {
    const schema = NotificationPreferenceMapper.toPersistence(preference);
    const updated = await this.repository.save(schema);
    return NotificationPreferenceMapper.toDomain(updated);
  }
}
