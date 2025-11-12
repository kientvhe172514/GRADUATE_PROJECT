import { DeviceActivityLog, ActivityType, ActivityStatus } from '../../domain/entities/device-activity-log.entity';

export interface DeviceActivityLogRepositoryPort {
  create(log: DeviceActivityLog): Promise<DeviceActivityLog>;
  findByAccountId(accountId: number, limit?: number): Promise<DeviceActivityLog[]>;
  findByDeviceSessionId(deviceSessionId: number, limit?: number): Promise<DeviceActivityLog[]>;
  findSuspiciousActivities(accountId: number, limit?: number): Promise<DeviceActivityLog[]>;
  findByActivityType(accountId: number, activityType: ActivityType, limit?: number): Promise<DeviceActivityLog[]>;
  countFailedLogins(accountId: number, withinMinutes: number): Promise<number>;
  countFailedLoginsByIp(ipAddress: string, withinMinutes: number): Promise<number>;
  findRecentActivitiesByIp(ipAddress: string, withinMinutes: number): Promise<DeviceActivityLog[]>;
}
