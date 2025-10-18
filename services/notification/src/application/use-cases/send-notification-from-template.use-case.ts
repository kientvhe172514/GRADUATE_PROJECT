import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { NotificationTemplate } from '../../domain/entities/notification-template.entity';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationTemplateRepositoryPort } from '../ports/notification-template.repository.port';
import { SendNotificationFromTemplateDto } from '../dtos/send-notification-from-template.dto';
import { SendNotificationUseCase } from './send-notification.use-case';
import { SendNotificationDto } from '../dtos/send-notification.dto';
import { DeliveryChannel } from '../../domain/value-objects/delivery-channel.vo';

export const NOTIFICATION_TEMPLATE_REPOSITORY = 'NOTIFICATION_TEMPLATE_REPOSITORY';

@Injectable()
export class SendNotificationFromTemplateUseCase {
  private readonly logger = new Logger(SendNotificationFromTemplateUseCase.name);

  constructor(
    @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
    private readonly templateRepo: NotificationTemplateRepositoryPort,
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(dto: SendNotificationFromTemplateDto): Promise<Notification> {
    this.logger.log(`Sending notification from template: ${dto.templateCode}`);

    // 1. Get template
    const template = await this.templateRepo.findActiveByCode(dto.templateCode);
    if (!template) {
      throw new NotFoundException(`Template not found: ${dto.templateCode}`);
    }

    // 2. Render template with variables
    const rendered = template.render(dto.variables);

    // 3. Build send notification DTO
    const sendDto: SendNotificationDto = {
      recipientId: dto.recipientId,
      title: rendered.title,
      message: rendered.message,
      notificationType: template.notificationType,
      priority: dto.priority,
      channels: template.defaultChannels,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
      metadata: {
        ...dto.metadata,
        templateCode: dto.templateCode,
        templateVariables: dto.variables,
      },
    };

    // 4. Send notification
    return await this.sendNotificationUseCase.execute(sendDto);
  }
}
