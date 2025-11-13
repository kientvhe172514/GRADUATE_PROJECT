import { DeviceSecurityAlert, AlertType, AlertSeverity, AlertStatus } from '../../domain/entities/device-security-alert.entity';

export interface DeviceSecurityAlertRepositoryPort {
  create(alert: DeviceSecurityAlert): Promise<DeviceSecurityAlert>;
  findById(id: number): Promise<DeviceSecurityAlert | null>;
  findByAccountId(accountId: number, limit?: number): Promise<DeviceSecurityAlert[]>;
  findPendingAlerts(accountId?: number): Promise<DeviceSecurityAlert[]>;
  findBySeverity(severity: AlertSeverity, limit?: number): Promise<DeviceSecurityAlert[]>;
  updateStatus(id: number, status: AlertStatus, reviewedBy?: number): Promise<void>;
  countPendingByAccount(accountId: number): Promise<number>;
  countBySeverity(severity: AlertSeverity): Promise<number>;
}
