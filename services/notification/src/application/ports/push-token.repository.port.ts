import { PushToken } from '../../domain/entities/push-token.entity';

export interface PushTokenRepositoryPort {
  create(token: PushToken): Promise<PushToken>;
  findByEmployeeId(employeeId: number): Promise<PushToken[]>;
  findActiveByEmployeeId(employeeId: number): Promise<PushToken[]>;
  findByDeviceId(employeeId: number, deviceId: string): Promise<PushToken | null>;
  update(token: PushToken): Promise<PushToken>;
  deactivateByToken(token: string): Promise<void>;
  deactivateByDeviceId(employeeId: number, deviceId: string): Promise<void>;
  deleteInactive(olderThanDays: number): Promise<number>;
}
