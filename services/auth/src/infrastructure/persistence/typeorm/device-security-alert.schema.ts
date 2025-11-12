import { EntitySchema } from 'typeorm';
import {
  DeviceSecurityAlert,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from '../../../domain/entities/device-security-alert.entity';

export const DeviceSecurityAlertSchema = new EntitySchema<DeviceSecurityAlert>({
  name: 'DeviceSecurityAlert',
  tableName: 'device_security_alerts',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    device_session_id: {
      type: 'bigint',
      nullable: true,
    },
    account_id: {
      type: 'bigint',
      nullable: false,
    },
    // Alert Details
    alert_type: {
      type: 'varchar',
      length: 50,
      nullable: false,
    },
    severity: {
      type: 'varchar',
      length: 20,
      nullable: false,
    },
    // Description
    title: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    details: {
      type: 'jsonb',
      nullable: true,
    },
    // Status
    status: {
      type: 'varchar',
      length: 20,
      default: AlertStatus.PENDING,
    },
    resolved_at: {
      type: 'timestamp',
      nullable: true,
    },
    resolved_by: {
      type: 'bigint',
      nullable: true,
    },
    resolution_note: {
      type: 'text',
      nullable: true,
    },
    // Auto Actions
    auto_action_taken: {
      type: 'boolean',
      default: false,
    },
    action_details: {
      type: 'jsonb',
      nullable: true,
    },
    // Timestamp
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
  },
  indices: [
    {
      name: 'idx_alerts_account_id',
      columns: ['account_id'],
    },
    {
      name: 'idx_alerts_device_session_id',
      columns: ['device_session_id'],
    },
    {
      name: 'idx_alerts_status',
      columns: ['status'],
    },
    {
      name: 'idx_alerts_severity',
      columns: ['severity'],
    },
    {
      name: 'idx_alerts_created_at',
      columns: ['created_at'],
    },
  ],
});
