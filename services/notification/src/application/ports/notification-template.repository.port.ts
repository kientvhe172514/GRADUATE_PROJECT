import { NotificationTemplate } from '../../domain/entities/notification-template.entity';
import { NotificationType } from '../../domain/enums/notification-type.enum';

export interface NotificationTemplateRepositoryPort {
  findByCode(code: string): Promise<NotificationTemplate | null>;
  findByType(type: NotificationType): Promise<NotificationTemplate[]>;
  findActiveByCode(code: string): Promise<NotificationTemplate | null>;
  create(template: NotificationTemplate): Promise<NotificationTemplate>;
  update(template: NotificationTemplate): Promise<NotificationTemplate>;
  findAll(): Promise<NotificationTemplate[]>;
}
