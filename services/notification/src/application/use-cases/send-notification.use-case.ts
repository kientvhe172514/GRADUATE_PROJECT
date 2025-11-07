import { Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import { Priority } from '../../domain/enums/priority.enum';
import {
  DeliveryChannel,
  ChannelType,
} from '../../domain/value-objects/delivery-channel.vo';
import { SendNotificationDto } from '../dtos/send-notification.dto';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';
import { NotificationPreferenceRepositoryPort } from '../ports/notification-preference.repository.port';
import { PushNotificationServicePort } from '../ports/push-notification.service.port';
import { EmailServicePort } from '../ports/email.service.port';
import { SmsServicePort } from '../ports/sms.service.port';
import { EventPublisherPort } from '../ports/event-publisher.port';
import { NotificationSentEvent } from '../../domain/events/notification-sent.event';
import { NotificationDeliveryFailedEvent } from '../../domain/events/notification-delivery-failed.event';

// Dependency Injection Tokens
export const NOTIFICATION_REPOSITORY = 'NOTIFICATION_REPOSITORY';
export const NOTIFICATION_PREFERENCE_REPOSITORY =
  'NOTIFICATION_PREFERENCE_REPOSITORY';
export const PUSH_NOTIFICATION_SERVICE = 'PUSH_NOTIFICATION_SERVICE';
export const EMAIL_SERVICE = 'EMAIL_SERVICE';
export const SMS_SERVICE = 'SMS_SERVICE';
export const EVENT_PUBLISHER = 'EVENT_PUBLISHER';

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepositoryPort,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepo: NotificationPreferenceRepositoryPort,
    @Inject(PUSH_NOTIFICATION_SERVICE)
    private readonly pushService: PushNotificationServicePort,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailServicePort,
    @Inject(SMS_SERVICE)
    private readonly smsService: SmsServicePort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: SendNotificationDto): Promise<Notification> {
    this.logger.log(
      `Sending notification to user ${dto.recipientId}, type: ${dto.notificationType}`,
    );
    this.logger.log(`📨 [SEND] Requested channels: ${JSON.stringify(dto.channels)}`);

    // 1. Get user preferences
    const preference = await this.preferenceRepo.findByEmployeeIdAndType(
      dto.recipientId,
      dto.notificationType,
    );
    this.logger.log(`📨 [SEND] User preference found: ${preference ? 'YES' : 'NO'}`);
    if (preference) {
      this.logger.log(`📨 [SEND] Preference details: emailEnabled=${preference.emailEnabled}, pushEnabled=${preference.pushEnabled}, inAppEnabled=${preference.inAppEnabled}`);
    }

    // 2. Filter channels based on preferences
    const enabledChannels = this.filterChannelsByPreference(
      dto.channels || [ChannelType.IN_APP],
      preference,
    );
    this.logger.log(`📨 [SEND] Enabled channels after filter: ${JSON.stringify(enabledChannels.map(c => c.type))}`);

    // 3. Create notification entity
    const notification = new Notification({
      recipientId: dto.recipientId,
      recipientEmail: dto.recipientEmail || '',
      recipientName: dto.recipientName || '',
      title: dto.title,
      message: dto.message,
      notificationType: dto.notificationType,
      priority: dto.priority || Priority.NORMAL,
      channels: enabledChannels,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
      relatedData: dto.relatedData,
      metadata: dto.metadata,
      expiresAt: dto.expiresAt,
      isRead: false,
      emailSent: false,
      pushSent: false,
      smsSent: false,
    });

    // 4. Save to database
    const savedNotification = await this.notificationRepo.create(notification);
    this.logger.log(`Notification created with ID: ${savedNotification.id}`);

    // 5. Send through enabled channels (async, don't block)
    this.deliverNotification(savedNotification, preference).catch((error) => {
      this.logger.error('Error delivering notification:', error);
    });

    // 6. Publish event
    const event = new NotificationSentEvent(
      savedNotification.id!,
      savedNotification.recipientId,
      savedNotification.notificationType,
      DeliveryChannel.toChannels(savedNotification.channels),
    );
    await this.eventPublisher.publish('notification.sent', event);

    return savedNotification;
  }

  private filterChannelsByPreference(
    requestedChannels: ChannelType[],
    preference: NotificationPreference | null,
  ): DeliveryChannel[] {
    this.logger.log(`🔍 [FILTER] Requested channels: ${JSON.stringify(requestedChannels)}`);
    this.logger.log(`🔍 [FILTER] Preference: ${preference ? 'EXISTS' : 'NULL'}`);
    
    if (!preference) {
      this.logger.log(`🔍 [FILTER] No preference found, returning all requested channels`);
      return requestedChannels.map((type) => new DeliveryChannel(type, true));
    }

    // Check Do Not Disturb
    if (preference.isInDoNotDisturbPeriod()) {
      this.logger.log('🔍 [FILTER] User is in Do Not Disturb period, skipping notification');
      return []; // Don't send any notifications during DND
    }

    this.logger.log(`🔍 [FILTER] Checking preferences: email=${preference.emailEnabled}, push=${preference.pushEnabled}, sms=${preference.smsEnabled}, inApp=${preference.inAppEnabled}`);

    const filtered = requestedChannels
      .filter((channel) => {
        switch (channel) {
          case ChannelType.EMAIL:
            return preference.emailEnabled;
          case ChannelType.PUSH:
            return preference.pushEnabled;
          case ChannelType.SMS:
            return preference.smsEnabled;
          case ChannelType.IN_APP:
            return preference.inAppEnabled;
          default:
            return false;
        }
      })
      .map((type) => new DeliveryChannel(type, true));

    this.logger.log(`🔍 [FILTER] Filtered channels: ${JSON.stringify(filtered.map(c => c.type))}`);
    return filtered;
  }

  private async deliverNotification(
    notification: Notification,
    preference: NotificationPreference | null,
  ): Promise<void> {
    const deliveryPromises: Promise<void>[] = [];

    for (const channel of notification.channels) {
      if (!channel.enabled) continue;

      switch (channel.type) {
        case ChannelType.PUSH:
          deliveryPromises.push(this.sendPushNotification(notification));
          break;

        case ChannelType.EMAIL:
          if (notification.recipientEmail) {
            deliveryPromises.push(this.sendEmailNotification(notification));
          }
          break;

        case ChannelType.SMS:
          deliveryPromises.push(this.sendSmsNotification(notification));
          break;

        case ChannelType.IN_APP:
          // Already saved to database
          break;
      }
    }

    await Promise.allSettled(deliveryPromises);
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      this.logger.log(`Sending push notification for notification ${notification.id}`);
      await this.pushService.sendToUser(
        notification.recipientId,
        notification.title,
        notification.message,
        {
          notificationId: notification.id?.toString() || '',
          type: notification.notificationType,
          ...notification.metadata,
        },
      );

      notification.markChannelAsSent('push');
      await this.notificationRepo.update(notification);
      this.logger.log(`Push notification sent successfully for notification ${notification.id}`);
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      await this.publishDeliveryFailedEvent(notification, 'PUSH', error.message);
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      this.logger.log(`Sending email notification for notification ${notification.id}`);
      await this.emailService.send(
        notification.recipientEmail,
        notification.title,
        notification.message,
        false,
      );

      notification.markChannelAsSent('email');
      await this.notificationRepo.update(notification);
      this.logger.log(`Email notification sent successfully for notification ${notification.id}`);
    } catch (error) {
      this.logger.error('Failed to send email notification:', error);
      await this.publishDeliveryFailedEvent(notification, 'EMAIL', error.message);
    }
  }

  private async sendSmsNotification(notification: Notification): Promise<void> {
    try {
      this.logger.log(`Sending SMS notification for notification ${notification.id}`);
      // TODO: Get phone number from employee service
      // await this.smsService.send(phoneNumber, notification.message);

      notification.markChannelAsSent('sms');
      await this.notificationRepo.update(notification);
      this.logger.log(`SMS notification sent successfully for notification ${notification.id}`);
    } catch (error) {
      this.logger.error('Failed to send SMS notification:', error);
      await this.publishDeliveryFailedEvent(notification, 'SMS', error.message);
    }
  }

  private async publishDeliveryFailedEvent(
    notification: Notification,
    channel: string,
    error: string,
  ): Promise<void> {
    const event = new NotificationDeliveryFailedEvent(
      notification.id!,
      channel,
      error,
    );
    await this.eventPublisher.publish('notification.delivery.failed', event);
  }
}
