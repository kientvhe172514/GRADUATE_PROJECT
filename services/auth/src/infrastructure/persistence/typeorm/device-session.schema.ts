import { EntitySchema } from 'typeorm';
import {
  DeviceSession,
  DeviceStatus,
  DevicePlatform,
  FcmTokenStatus,
} from '../../../domain/entities/device-session.entity';

export const DeviceSessionSchema = new EntitySchema<DeviceSession>({
  name: 'DeviceSession',
  tableName: 'device_sessions',
  columns: {
    id: {
      type: 'bigint',
      primary: true,
      generated: true,
    },
    account_id: {
      type: 'bigint',
      nullable: false,
    },
    employee_id: {
      type: 'bigint',
      nullable: true,
    },
    // Device Identification
    device_id: {
      type: 'varchar',
      length: 255,
      unique: true,
      nullable: false,
    },
    device_name: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    device_os: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    device_model: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    device_fingerprint: {
      type: 'text',
      nullable: true,
    },
    platform: {
      type: 'varchar',
      length: 20,
      nullable: false,
    },
    app_version: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    // Security & Trust
    is_trusted: {
      type: 'boolean',
      default: false,
    },
    trusted_at: {
      type: 'timestamp',
      nullable: true,
    },
    trusted_by: {
      type: 'bigint',
      nullable: true,
    },
    trust_verification_method: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    // Activity Tracking
    first_login_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    last_login_at: {
      type: 'timestamp',
      nullable: true,
    },
    last_active_at: {
      type: 'timestamp',
      nullable: true,
    },
    login_count: {
      type: 'int',
      default: 1,
    },
    failed_login_attempts: {
      type: 'int',
      default: 0,
    },
    last_failed_at: {
      type: 'timestamp',
      nullable: true,
    },
    // Location & Network
    last_ip_address: {
      type: 'varchar',
      length: 45,
      nullable: true,
    },
    last_location: {
      type: 'jsonb',
      nullable: true,
    },
    last_user_agent: {
      type: 'text',
      nullable: true,
    },
    network_type: {
      type: 'varchar',
      length: 20,
      nullable: true,
    },
    // FCM Token Cache
    fcm_token: {
      type: 'varchar',
      length: 500,
      nullable: true,
    },
    fcm_token_updated_at: {
      type: 'timestamp',
      nullable: true,
    },
    fcm_token_status: {
      type: 'varchar',
      length: 20,
      default: FcmTokenStatus.ACTIVE,
    },
    // Status & Lifecycle
    status: {
      type: 'varchar',
      length: 20,
      default: DeviceStatus.ACTIVE,
    },
    revoked_at: {
      type: 'timestamp',
      nullable: true,
    },
    revoked_by: {
      type: 'bigint',
      nullable: true,
    },
    revoke_reason: {
      type: 'text',
      nullable: true,
    },
    expires_at: {
      type: 'timestamp',
      nullable: true,
    },
    // Audit
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  indices: [
    {
      name: 'idx_device_sessions_account_id',
      columns: ['account_id'],
    },
    {
      name: 'idx_device_sessions_employee_id',
      columns: ['employee_id'],
    },
    {
      name: 'idx_device_sessions_device_id',
      columns: ['device_id'],
    },
    {
      name: 'idx_device_sessions_status',
      columns: ['status'],
    },
    {
      name: 'idx_device_sessions_platform',
      columns: ['platform'],
    },
  ],
});
