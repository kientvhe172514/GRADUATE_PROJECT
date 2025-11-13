export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
  SUSPICIOUS = 'SUSPICIOUS',
}

export enum DevicePlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

export enum FcmTokenStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  INVALID = 'INVALID',
}

export interface DeviceLocation {
  country?: string;
  city?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
}

export class DeviceSession {
  id?: number;
  account_id: number;
  employee_id?: number;

  // Device Identification
  device_id: string;
  device_name?: string;
  device_os?: string;
  device_model?: string;
  device_fingerprint?: string;
  platform: DevicePlatform;
  app_version?: string;

  // Security & Trust
  is_trusted: boolean = false;
  trusted_at?: Date;
  trusted_by?: number;
  trust_verification_method?: string;

  // Activity Tracking
  first_login_at: Date;
  last_login_at?: Date;
  last_active_at?: Date;
  login_count: number = 1;
  failed_login_attempts: number = 0;
  last_failed_at?: Date;

  // Location & Network
  last_ip_address?: string;
  last_location?: DeviceLocation;
  last_user_agent?: string;
  network_type?: string;

  // FCM Token Cache
  fcm_token?: string;
  fcm_token_updated_at?: Date;
  fcm_token_status: FcmTokenStatus = FcmTokenStatus.ACTIVE;

  // Status & Lifecycle
  status: DeviceStatus = DeviceStatus.ACTIVE;
  revoked_at?: Date;
  revoked_by?: number;
  revoke_reason?: string;
  expires_at?: Date;

  // Audit
  created_at?: Date;
  updated_at?: Date;

  constructor(data?: Partial<DeviceSession>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
