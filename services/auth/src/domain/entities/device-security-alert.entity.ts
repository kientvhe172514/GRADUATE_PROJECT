export enum AlertType {
  SUSPICIOUS_LOCATION = 'SUSPICIOUS_LOCATION',
  MULTIPLE_FAILED_LOGINS = 'MULTIPLE_FAILED_LOGINS',
  NEW_DEVICE = 'NEW_DEVICE',
  IMPOSSIBLE_TRAVEL = 'IMPOSSIBLE_TRAVEL',
  UNUSUAL_ACCESS_TIME = 'UNUSUAL_ACCESS_TIME',
  TOKEN_THEFT_SUSPECTED = 'TOKEN_THEFT_SUSPECTED',
  PASSWORD_BREACH_DETECTED = 'PASSWORD_BREACH_DETECTED',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

export class DeviceSecurityAlert {
  id?: number;
  device_session_id?: number;
  account_id: number;

  // Alert Details
  alert_type: AlertType;
  severity: AlertSeverity;

  // Description
  title: string;
  description?: string;
  details?: Record<string, any>;

  // Status
  status: AlertStatus = AlertStatus.PENDING;
  resolved_at?: Date;
  resolved_by?: number;
  resolution_note?: string;

  // Auto Actions
  auto_action_taken: boolean = false;
  action_details?: Record<string, any>;

  // Timestamp
  created_at?: Date;
}
