import { EntitySchema } from 'typeorm';
import {
  DeviceActivityLog,
  ActivityType,
  ActivityStatus,
} from '../../../domain/entities/device-activity-log.entity';

export const DeviceActivityLogSchema = new EntitySchema<DeviceActivityLog>({
  name: 'DeviceActivityLog',
  tableName: 'device_activity_logs',
  columns: {
    id: {
      type: 'bigint',
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
    // Activity Details
    activity_type: {
      type: 'varchar',
      length: 50,
      nullable: false,
    },
    status: {
      type: 'varchar',
      length: 20,
      nullable: false,
    },
    // Location & Network
    ip_address: {
      type: 'varchar',
      length: 45,
      nullable: true,
    },
    location: {
      type: 'jsonb',
      nullable: true,
    },
    user_agent: {
      type: 'text',
      nullable: true,
    },
    // Security Analysis
    is_suspicious: {
      type: 'boolean',
      default: false,
    },
    suspicious_reason: {
      type: 'text',
      nullable: true,
    },
    risk_score: {
      type: 'int',
      nullable: true,
    },
    // Additional Context
    metadata: {
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
      name: 'idx_activity_account_id',
      columns: ['account_id'],
    },
    {
      name: 'idx_activity_device_session_id',
      columns: ['device_session_id'],
    },
    {
      name: 'idx_activity_type',
      columns: ['activity_type'],
    },
    {
      name: 'idx_activity_status',
      columns: ['status'],
    },
    {
      name: 'idx_activity_created_at',
      columns: ['created_at'],
    },
  ],
});
