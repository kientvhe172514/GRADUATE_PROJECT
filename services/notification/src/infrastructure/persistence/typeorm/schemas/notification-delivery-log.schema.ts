import { EntitySchema } from 'typeorm';

export interface NotificationDeliveryLog {
  id: number;
  notification_id: number;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  recipient: string; // Email, phone number, device token
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  
  // External provider tracking
  external_message_id: string | null; // SendGrid message ID, Twilio SID, FCM message ID
  provider: string | null; // 'SendGrid', 'Twilio', 'FCM', 'OneSignal'
  
  // Timestamps
  sent_at: Date | null;
  delivered_at: Date | null;
  failed_at: Date | null;
  
  // Error handling
  error_message: string | null;
  retry_count: number;
  last_retry_at: Date | null;
  
  // Metadata
  metadata: Record<string, any> | null; // Open rate, click rate, bounce reason
  created_at: Date;
}

export const NotificationDeliveryLogSchema = new EntitySchema<NotificationDeliveryLog>({
  name: 'NotificationDeliveryLog',
  tableName: 'notification_delivery_logs',
  columns: {
    id: {
      type: 'bigint',
      primary: true,
      generated: 'increment',
    },
    notification_id: {
      type: 'bigint',
      comment: 'Link to notification_preferences or notifications table',
    },
    channel: {
      type: 'varchar',
      length: 20,
      comment: 'EMAIL, SMS, PUSH, IN_APP',
    },
    recipient: {
      type: 'varchar',
      length: 255,
      comment: 'Email, phone number, device token',
    },
    status: {
      type: 'varchar',
      length: 20,
      default: 'PENDING',
      comment: 'PENDING, SENT, DELIVERED, FAILED, BOUNCED',
    },
    external_message_id: {
      type: 'varchar',
      length: 255,
      nullable: true,
      comment: 'External provider message ID',
    },
    provider: {
      type: 'varchar',
      length: 50,
      nullable: true,
      comment: 'SendGrid, Twilio, FCM, OneSignal',
    },
    sent_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'When sent to provider',
    },
    delivered_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'When delivered to recipient',
    },
    failed_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'When delivery failed',
    },
    error_message: {
      type: 'text',
      nullable: true,
      comment: 'Error from provider',
    },
    retry_count: {
      type: 'int',
      default: 0,
      comment: 'Number of retry attempts',
    },
    last_retry_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'Last retry timestamp',
    },
    metadata: {
      type: 'jsonb',
      nullable: true,
      comment: 'Open rate, click tracking, bounce reason',
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      comment: 'Log created timestamp',
    },
  },
  indices: [
    {
      name: 'idx_notification_delivery_logs_notification_id',
      columns: ['notification_id'],
    },
    {
      name: 'idx_notification_delivery_logs_status',
      columns: ['status', 'created_at'],
    },
    {
      name: 'idx_notification_delivery_logs_channel',
      columns: ['channel', 'status'],
    },
    {
      name: 'idx_notification_delivery_logs_external_id',
      columns: ['external_message_id'],
    },
    {
      name: 'idx_notification_delivery_logs_created_at',
      columns: ['created_at'],
    },
  ],
});
