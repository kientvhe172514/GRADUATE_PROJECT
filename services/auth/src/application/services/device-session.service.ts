import { Injectable, Inject } from '@nestjs/common';
import { DeviceSession, DeviceStatus, DevicePlatform, FcmTokenStatus } from '../../domain/entities/device-session.entity';
import { DeviceActivityLog, ActivityType, ActivityStatus } from '../../domain/entities/device-activity-log.entity';
import { DeviceSecurityAlert, AlertType, AlertSeverity } from '../../domain/entities/device-security-alert.entity';
import { DeviceSessionRepositoryPort } from '../ports/device-session.repository.port';
import { DeviceActivityLogRepositoryPort } from '../ports/device-activity-log.repository.port';
import { DeviceSecurityAlertRepositoryPort } from '../ports/device-security-alert.repository.port';
import {
  DEVICE_SESSION_REPOSITORY,
  DEVICE_ACTIVITY_LOG_REPOSITORY,
  DEVICE_SECURITY_ALERT_REPOSITORY,
} from '../tokens';

export interface DeviceInfo {
  device_id: string;
  device_name?: string;
  device_os?: string;
  device_model?: string;
  device_fingerprint?: string;
  platform: DevicePlatform;
  app_version?: string;
  ip_address?: string;
  location?: any;
  user_agent?: string;
  fcm_token?: string;
}

export interface SecurityCheckResult {
  is_suspicious: boolean;
  risk_score: number;
  suspicious_reasons: string[];
  alerts: DeviceSecurityAlert[];
}

@Injectable()
export class DeviceSessionService {
  private readonly IMPOSSIBLE_TRAVEL_THRESHOLD_KM = 500;
  private readonly IMPOSSIBLE_TRAVEL_WINDOW_HOURS = 1;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly FAILED_ATTEMPTS_WINDOW_MINUTES = 10;

  constructor(
    @Inject(DEVICE_SESSION_REPOSITORY)
    private deviceSessionRepo: DeviceSessionRepositoryPort,
    @Inject(DEVICE_ACTIVITY_LOG_REPOSITORY)
    private activityLogRepo: DeviceActivityLogRepositoryPort,
    @Inject(DEVICE_SECURITY_ALERT_REPOSITORY)
    private securityAlertRepo: DeviceSecurityAlertRepositoryPort,
  ) {}

  /**
   * Create or update device session on login
   */
  async createOrUpdateDeviceSession(
    accountId: number,
    employeeId: number | null,
    deviceInfo: DeviceInfo,
  ): Promise<DeviceSession> {
    // Check if device already exists
    const existingDevice = await this.deviceSessionRepo.findActiveByDeviceId(deviceInfo.device_id);

    if (existingDevice) {
      // Update existing device session
      const updates: Partial<DeviceSession> = {
        last_login_at: new Date(),
        last_active_at: new Date(),
        last_ip_address: deviceInfo.ip_address,
        last_location: deviceInfo.location,
        last_user_agent: deviceInfo.user_agent,
        device_name: deviceInfo.device_name || existingDevice.device_name,
        device_os: deviceInfo.device_os || existingDevice.device_os,
        device_model: deviceInfo.device_model || existingDevice.device_model,
        app_version: deviceInfo.app_version,
      };

      // Update FCM token if provided
      if (deviceInfo.fcm_token) {
        updates.fcm_token = deviceInfo.fcm_token;
        updates.fcm_token_updated_at = new Date();
        updates.fcm_token_status = FcmTokenStatus.ACTIVE;
      }

      await this.deviceSessionRepo.incrementLoginCount(existingDevice.id!);
      await this.deviceSessionRepo.resetFailedAttempts(existingDevice.id!);

      return await this.deviceSessionRepo.update(existingDevice.id!, updates);
    } else {
      // Create new device session
      const newDevice = new DeviceSession({
        account_id: accountId,
        employee_id: employeeId,
        device_id: deviceInfo.device_id,
        device_name: deviceInfo.device_name,
        device_os: deviceInfo.device_os,
        device_model: deviceInfo.device_model,
        device_fingerprint: deviceInfo.device_fingerprint,
        platform: deviceInfo.platform,
        app_version: deviceInfo.app_version,
        first_login_at: new Date(),
        last_login_at: new Date(),
        last_active_at: new Date(),
        last_ip_address: deviceInfo.ip_address,
        last_location: deviceInfo.location,
        last_user_agent: deviceInfo.user_agent,
        network_type: this.detectNetworkType(deviceInfo.user_agent),
        fcm_token: deviceInfo.fcm_token,
        fcm_token_updated_at: deviceInfo.fcm_token ? new Date() : undefined,
        fcm_token_status: deviceInfo.fcm_token ? FcmTokenStatus.ACTIVE : undefined,
        login_count: 1,
        failed_login_attempts: 0,
        status: DeviceStatus.ACTIVE,
        is_trusted: false,
        created_at: new Date(),
      });

      return await this.deviceSessionRepo.create(newDevice);
    }
  }

  /**
   * Log device activity
   */
  async logActivity(
    accountId: number,
    deviceSessionId: number,
    activityType: ActivityType,
    status: ActivityStatus,
    ipAddress?: string,
    location?: any,
    userAgent?: string,
    metadata?: any,
    isSuspicious: boolean = false,
    suspiciousReason?: string,
    riskScore: number = 0,
  ): Promise<DeviceActivityLog> {
    const log = new DeviceActivityLog({
      account_id: accountId,
      device_session_id: deviceSessionId,
      activity_type: activityType,
      status,
      ip_address: ipAddress,
      location,
      user_agent: userAgent,
      metadata,
      is_suspicious: isSuspicious,
      suspicious_reason: suspiciousReason,
      risk_score: riskScore,
      created_at: new Date(),
    });

    return await this.activityLogRepo.create(log);
  }

  /**
   * Perform security checks on login
   */
  async performSecurityCheck(
    accountId: number,
    deviceSessionId: number,
    deviceInfo: DeviceInfo,
  ): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      is_suspicious: false,
      risk_score: 0,
      suspicious_reasons: [],
      alerts: [],
    };

    // Check 1: Multiple failed login attempts
    const failedAttempts = await this.activityLogRepo.countFailedLogins(
      accountId,
      this.FAILED_ATTEMPTS_WINDOW_MINUTES,
    );

    if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      result.is_suspicious = true;
      result.risk_score += 30;
      result.suspicious_reasons.push(`${failedAttempts} failed login attempts in ${this.FAILED_ATTEMPTS_WINDOW_MINUTES} minutes`);

      const alert = await this.createSecurityAlert(
        accountId,
        deviceSessionId,
        AlertType.MULTIPLE_FAILED_LOGINS,
        AlertSeverity.HIGH,
        `${failedAttempts} failed login attempts detected`,
        { failed_attempts: failedAttempts, window_minutes: this.FAILED_ATTEMPTS_WINDOW_MINUTES },
      );
      result.alerts.push(alert);
    }

    // Check 2: New device
    const existingDevice = await this.deviceSessionRepo.findByDeviceId(deviceInfo.device_id);
    if (!existingDevice) {
      result.risk_score += 20;
      result.suspicious_reasons.push('New device detected');

      const alert = await this.createSecurityAlert(
        accountId,
        deviceSessionId,
        AlertType.NEW_DEVICE,
        AlertSeverity.MEDIUM,
        `Login from new device: ${deviceInfo.device_name || deviceInfo.platform}`,
        { device_info: deviceInfo },
      );
      result.alerts.push(alert);
    }

    // Check 3: Suspicious location (impossible travel)
    if (existingDevice && existingDevice.last_location && deviceInfo.location) {
      const distance = this.calculateDistance(existingDevice.last_location, deviceInfo.location);
      const timeDiff = (new Date().getTime() - new Date(existingDevice.last_active_at!).getTime()) / (1000 * 60 * 60); // hours

      if (distance > this.IMPOSSIBLE_TRAVEL_THRESHOLD_KM && timeDiff < this.IMPOSSIBLE_TRAVEL_WINDOW_HOURS) {
        result.is_suspicious = true;
        result.risk_score += 50;
        result.suspicious_reasons.push(`Impossible travel: ${distance.toFixed(0)}km in ${timeDiff.toFixed(1)} hours`);

        const alert = await this.createSecurityAlert(
          accountId,
          deviceSessionId,
          AlertType.IMPOSSIBLE_TRAVEL,
          AlertSeverity.CRITICAL,
          `Impossible travel detected: ${distance.toFixed(0)}km in ${timeDiff.toFixed(1)} hours`,
          {
            distance_km: distance,
            time_diff_hours: timeDiff,
            previous_location: existingDevice.last_location,
            current_location: deviceInfo.location,
          },
        );
        result.alerts.push(alert);
      } else if (distance > 100) {
        // New location but not impossible
        result.risk_score += 10;
        result.suspicious_reasons.push(`New location: ${distance.toFixed(0)}km from last known location`);

        const alert = await this.createSecurityAlert(
          accountId,
          deviceSessionId,
          AlertType.SUSPICIOUS_LOCATION,
          AlertSeverity.LOW,
          `Login from new location: ${distance.toFixed(0)}km away`,
          { distance_km: distance, previous_location: existingDevice.last_location, current_location: deviceInfo.location },
        );
        result.alerts.push(alert);
      }
    }

    // Determine if suspicious based on risk score
    if (result.risk_score >= 50) {
      result.is_suspicious = true;
    }

    return result;
  }

  /**
   * Create security alert
   */
  async createSecurityAlert(
    accountId: number,
    deviceSessionId: number,
    alertType: AlertType,
    severity: AlertSeverity,
    description: string,
    metadata?: any,
    autoAction?: string,
  ): Promise<DeviceSecurityAlert> {
    const alert = new DeviceSecurityAlert({
      account_id: accountId,
      device_session_id: deviceSessionId,
      alert_type: alertType,
      severity,
      description,
      metadata,
      auto_action_taken: autoAction,
      created_at: new Date(),
    });

    return await this.securityAlertRepo.create(alert);
  }

  /**
   * Get account devices
   */
  async getAccountDevices(accountId: number, activeOnly: boolean = false): Promise<DeviceSession[]> {
    if (activeOnly) {
      return await this.deviceSessionRepo.findActiveByAccountId(accountId);
    }
    return await this.deviceSessionRepo.findByAccountId(accountId);
  }

  /**
   * Revoke device
   */
  async revokeDevice(deviceId: number, revokedBy: number, reason: string): Promise<void> {
    await this.deviceSessionRepo.revokeDevice(deviceId, revokedBy, reason);
  }

  /**
   * Update device last active timestamp
   */
  async updateLastActive(deviceSessionId: number): Promise<void> {
    await this.deviceSessionRepo.updateLastActive(deviceSessionId);
  }

  /**
   * Update FCM token
   */
  async updateFcmToken(deviceSessionId: number, fcmToken: string): Promise<void> {
    await this.deviceSessionRepo.updateFcmToken(deviceSessionId, fcmToken);
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  private calculateDistance(loc1: any, loc2: any): number {
    if (!loc1?.latitude || !loc1?.longitude || !loc2?.latitude || !loc2?.longitude) {
      return 0;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.latitude)) *
        Math.cos(this.toRad(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Detect network type from user agent
   */
  private detectNetworkType(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    // Simple detection - can be enhanced
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('WiFi')) return 'wifi';
    return 'unknown';
  }
}
