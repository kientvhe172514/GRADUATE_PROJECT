export enum ScheduleType {
  ONCE = 'ONCE',
  RECURRING = 'RECURRING',
}

export enum RecipientType {
  INDIVIDUAL = 'INDIVIDUAL',
  DEPARTMENT = 'DEPARTMENT',
  ALL_EMPLOYEES = 'ALL_EMPLOYEES',
}

export enum ScheduledNotificationStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class ScheduledNotification {
  id?: number;
  
  schedule_type: ScheduleType;
  
  recipient_type: RecipientType;
  recipient_ids?: number[];
  
  title: string;
  message: string;
  notification_type: string;
  channels: string[];
  
  scheduled_at?: Date;
  cron_expression?: string;
  timezone: string = 'Asia/Ho_Chi_Minh';
  
  status: ScheduledNotificationStatus = ScheduledNotificationStatus.ACTIVE;
  last_run_at?: Date;
  next_run_at?: Date;
  
  created_by: number;
  created_at?: Date;
  updated_at?: Date;

  constructor(data: Partial<ScheduledNotification>) {
    Object.assign(this, data);
    this.created_at = this.created_at || new Date();
    this.updated_at = this.updated_at || new Date();
  }

  isActive(): boolean {
    return this.status === ScheduledNotificationStatus.ACTIVE;
  }

  isRecurring(): boolean {
    return this.schedule_type === ScheduleType.RECURRING;
  }

  isDue(): boolean {
    if (!this.next_run_at) return false;
    return new Date() >= this.next_run_at;
  }

  markAsRun(): void {
    this.last_run_at = new Date();
    this.updateTimestamp();
  }

  pause(): void {
    this.status = ScheduledNotificationStatus.PAUSED;
    this.updateTimestamp();
  }

  resume(): void {
    this.status = ScheduledNotificationStatus.ACTIVE;
    this.updateTimestamp();
  }

  cancel(): void {
    this.status = ScheduledNotificationStatus.CANCELLED;
    this.updateTimestamp();
  }

  private updateTimestamp(): void {
    this.updated_at = new Date();
  }
}