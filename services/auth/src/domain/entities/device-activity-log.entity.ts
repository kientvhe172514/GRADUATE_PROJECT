export enum ActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  SUSPICIOUS = 'SUSPICIOUS',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
  FCM_TOKEN_UPDATE = 'FCM_TOKEN_UPDATE',
  DEVICE_TRUST = 'DEVICE_TRUST',
  DEVICE_REVOKE = 'DEVICE_REVOKE',
}

export enum ActivityStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
}

export interface ActivityLocation {
  country?: string;
  city?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
}

export class DeviceActivityLog {
  id?: number;
  device_session_id?: number;
  account_id: number;

  // Activity Details
  activity_type: ActivityType;
  status: ActivityStatus;

  // Location & Network
  ip_address?: string;
  location?: ActivityLocation;
  user_agent?: string;

  // Security Analysis
  is_suspicious: boolean = false;
  suspicious_reason?: string;
  risk_score?: number; // 0-100

  // Additional Context
  metadata?: Record<string, any>;

  // Timestamp
  created_at?: Date;
}
