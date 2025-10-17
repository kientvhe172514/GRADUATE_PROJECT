export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class NotificationPriorityVO {
  constructor(private readonly value: NotificationPriority) {
    if (!Object.values(NotificationPriority).includes(value)) {
      throw new Error(`Invalid notification priority: ${value}`);
    }
  }

  getValue(): NotificationPriority {
    return this.value;
  }

  isUrgent(): boolean {
    return this.value === NotificationPriority.URGENT;
  }

  isHigh(): boolean {
    return this.value === NotificationPriority.HIGH;
  }

  isNormal(): boolean {
    return this.value === NotificationPriority.NORMAL;
  }

  isLow(): boolean {
    return this.value === NotificationPriority.LOW;
  }

  getPriorityLevel(): number {
    switch (this.value) {
      case NotificationPriority.URGENT:
        return 4;
      case NotificationPriority.HIGH:
        return 3;
      case NotificationPriority.NORMAL:
        return 2;
      case NotificationPriority.LOW:
        return 1;
      default:
        return 0;
    }
  }

  shouldBypassDoNotDisturb(): boolean {
    return this.isUrgent() || this.isHigh();
  }

  getDeliveryTimeout(): number {
    switch (this.value) {
      case NotificationPriority.URGENT:
        return 30; // 30 seconds
      case NotificationPriority.HIGH:
        return 60; // 1 minute
      case NotificationPriority.NORMAL:
        return 300; // 5 minutes
      case NotificationPriority.LOW:
        return 900; // 15 minutes
      default:
        return 300;
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationPriorityVO): boolean {
    return this.value === other.value;
  }
}
