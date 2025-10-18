import { NotificationType } from '../enums/notification-type.enum';

export class NotificationPreference {
  id?: number;
  employeeId: number;
  notificationType: NotificationType;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  doNotDisturbStart?: string; // HH:mm format
  doNotDisturbEnd?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<NotificationPreference>) {
    Object.assign(this, data);
    this.emailEnabled = this.emailEnabled ?? true;
    this.pushEnabled = this.pushEnabled ?? true;
    this.smsEnabled = this.smsEnabled ?? false;
    this.inAppEnabled = this.inAppEnabled ?? true;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }

  isInDoNotDisturbPeriod(): boolean {
    if (!this.doNotDisturbStart || !this.doNotDisturbEnd) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= this.doNotDisturbStart && currentTime <= this.doNotDisturbEnd;
  }

  updateTimestamp(): void {
    this.updatedAt = new Date();
  }
}
