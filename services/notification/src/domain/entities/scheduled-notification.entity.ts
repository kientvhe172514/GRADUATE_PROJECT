import { NotificationType } from '../enums/notification-type.enum';
import { ChannelType } from '../value-objects/delivery-channel.vo';

export enum ScheduleType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
}

export enum RecipientType {
  INDIVIDUAL = 'INDIVIDUAL',
  DEPARTMENT = 'DEPARTMENT',
  ALL = 'ALL',
}

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
}

export class ScheduledNotification {
  id?: number;
  scheduleType: ScheduleType;
  recipientType: RecipientType;
  recipientIds?: number[];
  title: string;
  message: string;
  notificationType: NotificationType;
  channels: ChannelType[];
  scheduledAt?: Date;
  cronExpression?: string;
  timezone: string;
  status: ScheduleStatus;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<ScheduledNotification>) {
    Object.assign(this, data);
    this.timezone = this.timezone || 'Asia/Ho_Chi_Minh';
    this.status = this.status || ScheduleStatus.ACTIVE;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }

  shouldRun(): boolean {
    if (this.status !== ScheduleStatus.ACTIVE) return false;
    if (!this.nextRunAt) return false;
    return new Date() >= this.nextRunAt;
  }

  markAsRun(nextRun?: Date): void {
    this.lastRunAt = new Date();
    this.nextRunAt = nextRun;
    this.updatedAt = new Date();

    if (this.scheduleType === ScheduleType.ONE_TIME && !nextRun) {
      this.status = ScheduleStatus.COMPLETED;
    }
  }

  activate(): void {
    this.status = ScheduleStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = ScheduleStatus.INACTIVE;
    this.updatedAt = new Date();
  }
}
