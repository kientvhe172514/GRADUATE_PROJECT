import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplateRepositoryPort } from '../../application/ports/notification-template.repository.port';
import { NotificationTemplate } from '../../domain/entities/notification-template.entity';
import { NotificationTemplateSchema } from './typeorm/schemas/notification-template.schema';
import { NotificationTemplateMapper } from './typeorm/mappers/notification-template.mapper';
import { NotificationType } from '../../domain/enums/notification-type.enum';

@Injectable()
export class PostgresNotificationTemplateRepository implements NotificationTemplateRepositoryPort {
  constructor(
    @InjectRepository(NotificationTemplateSchema)
    private readonly repository: Repository<NotificationTemplateSchema>,
  ) {}

  async findByCode(code: string): Promise<NotificationTemplate | null> {
    const schema = await this.repository.findOne({ where: { template_code: code } });
    return schema ? NotificationTemplateMapper.toDomain(schema) : null;
  }

  async findByType(type: NotificationType): Promise<NotificationTemplate[]> {
    const schemas = await this.repository.find({
      where: { notification_type: type },
      order: { created_at: 'DESC' },
    });
    return schemas.map(NotificationTemplateMapper.toDomain);
  }

  async findActiveByCode(code: string): Promise<NotificationTemplate | null> {
    const schema = await this.repository.findOne({
      where: { template_code: code, status: 'ACTIVE' },
    });
    return schema ? NotificationTemplateMapper.toDomain(schema) : null;
  }

  async findAll(): Promise<NotificationTemplate[]> {
    const schemas = await this.repository.find({
      order: { created_at: 'DESC' },
    });
    return schemas.map(NotificationTemplateMapper.toDomain);
  }

  async create(template: NotificationTemplate): Promise<NotificationTemplate> {
    const schema = NotificationTemplateMapper.toSchema(template);
    const saved = await this.repository.save(schema);
    return NotificationTemplateMapper.toDomain(saved);
  }

  async update(template: NotificationTemplate): Promise<NotificationTemplate> {
    const schema = NotificationTemplateMapper.toSchema(template);
    const saved = await this.repository.save(schema);
    return NotificationTemplateMapper.toDomain(saved);
  }

  async delete(code: string): Promise<void> {
    await this.repository.delete({ template_code: code });
  }

  async activate(code: string): Promise<void> {
    await this.repository.update({ template_code: code }, { status: 'ACTIVE' });
  }

  async deactivate(code: string): Promise<void> {
    await this.repository.update({ template_code: code }, { status: 'INACTIVE' });
  }
}
