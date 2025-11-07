import { Notification } from '../../../../domain/entities/notification.entity';
import { NotificationSchema } from '../schemas/notification.schema';
import {
  DeliveryChannel,
  ChannelType,
} from '../../../../domain/value-objects/delivery-channel.vo';
import { NotificationType } from '../../../../domain/enums/notification-type.enum';
import { Priority } from '../../../../domain/enums/priority.enum';

export class NotificationMapper {
  static toDomain(schema: NotificationSchema): Notification {
    return new Notification({
      id: Number(schema.id),
      recipientId: Number(schema.recipient_id),
      recipientEmail: schema.recipient_email ?? undefined,
      recipientName: schema.recipient_name ?? undefined,
      title: schema.title,
      message: schema.message,
      notificationType: schema.notification_type as NotificationType,
      priority: schema.priority as Priority,
      relatedEntityType: schema.related_entity_type ?? undefined,
      relatedEntityId: schema.related_entity_id
        ? Number(schema.related_entity_id)
        : undefined,
      relatedData: schema.related_data as Record<string, any> | undefined,
      channels: schema.channels.map(
        (ch) => new DeliveryChannel(ch as ChannelType, true),
      ),
      isRead: schema.is_read,
      readAt: schema.read_at ?? undefined,
      emailSent: schema.email_sent,
      emailSentAt: schema.email_sent_at ?? undefined,
      pushSent: schema.push_sent,
      pushSentAt: schema.push_sent_at ?? undefined,
      smsSent: schema.sms_sent,
      smsSentAt: schema.sms_sent_at ?? undefined,
      metadata: schema.metadata as Record<string, any> | undefined,
      createdAt: schema.created_at,
      expiresAt: schema.expires_at ?? undefined,
    });
  }

  static toPersistence(notification: Notification): NotificationSchema {
    const schema = new NotificationSchema();
    if (notification.id) schema.id = notification.id;
    schema.recipient_id = notification.recipientId;
    schema.recipient_email = notification.recipientEmail ?? null;
    schema.recipient_name = notification.recipientName ?? null;
    schema.title = notification.title;
    schema.message = notification.message;
    schema.notification_type = notification.notificationType;
    schema.priority = notification.priority;
    schema.related_entity_type = notification.relatedEntityType ?? null;
    schema.related_entity_id = notification.relatedEntityId ?? null;
    schema.related_data = notification.relatedData ?? null;
    
    // Debug logging for channels
    console.log('🗄️ [MAPPER] notification.channels:', notification.channels);
    console.log('🗄️ [MAPPER] notification.channels.map(c => c.type):', notification.channels.map(c => c.type));
    const channelsArray = DeliveryChannel.toChannels(notification.channels);
    console.log('🗄️ [MAPPER] DeliveryChannel.toChannels result:', channelsArray);
    
    schema.channels = channelsArray;
    schema.is_read = notification.isRead;
    schema.read_at = notification.readAt ?? null;
    schema.email_sent = notification.emailSent;
    schema.email_sent_at = notification.emailSentAt ?? null;
    schema.push_sent = notification.pushSent;
    schema.push_sent_at = notification.pushSentAt ?? null;
    schema.sms_sent = notification.smsSent;
    schema.sms_sent_at = notification.smsSentAt ?? null;
    schema.metadata = notification.metadata ?? null;
    schema.created_at = notification.createdAt;
    schema.expires_at = notification.expiresAt ?? null;
    
    console.log('🗄️ [MAPPER] Final schema.channels:', schema.channels);
    return schema;
  }
}
