import { DeviceSession } from '../../domain/entities/device-session.entity';

export interface DeviceSessionRepositoryPort {
  create(deviceSession: DeviceSession): Promise<DeviceSession>;
  update(
    id: number,
    deviceSession: Partial<DeviceSession>,
  ): Promise<DeviceSession>;
  findById(id: number): Promise<DeviceSession | null>;
  findByDeviceId(deviceId: string): Promise<DeviceSession | null>;
  findByAccountId(accountId: number): Promise<DeviceSession[]>;
  findActiveByAccountId(accountId: number): Promise<DeviceSession[]>;
  findActiveByDeviceId(deviceId: string): Promise<DeviceSession | null>;
  findAll(
    page?: number,
    limit?: number,
  ): Promise<{ data: DeviceSession[]; total: number }>;
  revokeDevice(id: number, revokedBy: number, reason: string): Promise<void>;
  revokeAllByAccountId(
    accountId: number,
    revokedBy: number,
    reason: string,
  ): Promise<void>;
  updateLastActive(id: number): Promise<void>;
  incrementLoginCount(id: number): Promise<void>;
  incrementFailedAttempts(id: number): Promise<void>;
  resetFailedAttempts(id: number): Promise<void>;
  updateFcmToken(id: number, fcmToken: string): Promise<void>;
  findExpiredSessions(): Promise<DeviceSession[]>;
  cleanupExpiredSessions(): Promise<number>;
}
