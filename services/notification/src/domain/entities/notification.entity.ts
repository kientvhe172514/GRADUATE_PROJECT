import { NotificationType } from '../enums/notification-type.enum';
import { Priority } from '../enums/priority.enum';
import { DeliveryChannel } from '../value-objects/delivery-channel.vo';

export class Notification {
  id?: number;
  recipientId: number;
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  priority: Priority;
  relatedEntityType?: string;
  relatedEntityId?: number;
  relatedData?: Record<string, any>;
  channels: DeliveryChannel[];
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  pushSent: boolean;
  pushSentAt?: Date;
  smsSent: boolean;
  smsSentAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;

  constructor(data: Partial<Notification>) {
    Object.assign(this, data);
    this.isRead = this.isRead ?? false;
    this.emailSent = this.emailSent ?? false;
    this.pushSent = this.pushSent ?? false;
    this.smsSent = this.smsSent ?? false;
    this.createdAt = this.createdAt || new Date();
  }

  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }

  markChannelAsSent(channel: 'email' | 'push' | 'sms'): void {
    const now = new Date();
    switch (channel) {
      case 'email':
        this.emailSent = true;
        this.emailSentAt = now;
        break;
      case 'push':
        this.pushSent = true;
        this.pushSentAt = now;
        break;
      case 'sms':
        this.smsSent = true;
        this.smsSentAt = now;
        break;
    }
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  canBeRead(): boolean {
    return !this.isExpired() && !this.isRead;
  }
}
