export enum DeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export class NotificationDeliveryLog {
  id?: number;
  notification_id: number;
  channel: string;
  
  status: DeliveryStatus;
  
  external_id?: string;
  provider?: string;
  
  sent_at?: Date;
  delivered_at?: Date;
  error_message?: string;
  retry_count: number = 0;
  
  created_at?: Date;

  constructor(data: Partial<NotificationDeliveryLog>) {
    Object.assign(this, data);
    this.created_at = this.created_at || new Date();
  }

  isSuccessful(): boolean {
    return this.status === DeliveryStatus.DELIVERED;
  }

  isFailed(): boolean {
    return this.status === DeliveryStatus.FAILED;
  }

  isPending(): boolean {
    return this.status === DeliveryStatus.PENDING;
  }

  markAsSent(externalId?: string, provider?: string): void {
    this.status = DeliveryStatus.SENT;
    this.sent_at = new Date();
    if (externalId) this.external_id = externalId;
    if (provider) this.provider = provider;
  }

  markAsDelivered(): void {
    this.status = DeliveryStatus.DELIVERED;
    this.delivered_at = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = DeliveryStatus.FAILED;
    this.error_message = errorMessage;
  }

  incrementRetryCount(): void {
    this.retry_count++;
    this.status = DeliveryStatus.RETRYING;
  }
}
