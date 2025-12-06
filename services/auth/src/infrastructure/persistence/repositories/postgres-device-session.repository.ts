import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceSessionSchema } from '../typeorm/device-session.schema';
import { DeviceSessionRepositoryPort } from '../../../application/ports/device-session.repository.port';
import { DeviceSession } from '../../../domain/entities/device-session.entity';

@Injectable()
export class PostgresDeviceSessionRepository
  implements DeviceSessionRepositoryPort
{
  constructor(
    @InjectRepository(DeviceSessionSchema)
    private repository: Repository<any>,
  ) {}

  async create(deviceSession: DeviceSession): Promise<DeviceSession> {
    const saved = await this.repository.save(deviceSession);
    return saved;
  }

  async update(
    id: number,
    deviceSession: Partial<DeviceSession>,
  ): Promise<DeviceSession> {
    await this.repository.update(id, deviceSession);
    const updated = await this.repository.findOne({ where: { id } });
    return updated;
  }

  async findById(id: number): Promise<DeviceSession | null> {
    const result = await this.repository.findOne({ where: { id } });
    return result || null;
  }

  async findByAccountId(account_id: number): Promise<DeviceSession[]> {
    return await this.repository.find({
      where: { account_id },
      order: { last_login_at: 'DESC' },
    });
  }

  async findActiveByDeviceId(device_id: string): Promise<DeviceSession | null> {
    const result = await this.repository.findOne({
      where: { device_id, status: 'ACTIVE' },
    });
    return result || null;
  }

  async findActiveByAccountId(account_id: number): Promise<DeviceSession[]> {
    return await this.repository.find({
      where: { account_id, status: 'ACTIVE' },
      order: { last_login_at: 'DESC' },
    });
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async updateLastActive(id: number): Promise<void> {
    await this.repository.update(id, {
      last_active_at: new Date(),
      updated_at: new Date(),
    });
  }

  async incrementLoginCount(id: number): Promise<void> {
    await this.repository.increment({ id }, 'login_count', 1);
  }

  async resetFailedAttempts(id: number): Promise<void> {
    await this.repository.update(id, {
      failed_login_attempts: 0,
      updated_at: new Date(),
    });
  }

  async findByDeviceId(deviceId: string): Promise<DeviceSession | null> {
    const result = await this.repository.findOne({
      where: { device_id: deviceId },
    });
    return result || null;
  }

  async revokeDevice(
    id: number,
    revokedBy: number,
    reason: string,
  ): Promise<void> {
    await this.repository.update(id, {
      status: 'REVOKED',
      revoked_at: new Date(),
      revoked_by: revokedBy,
      revoke_reason: reason,
      updated_at: new Date(),
    });
  }

  async revokeAllByAccountId(
    accountId: number,
    revokedBy: number,
    reason: string,
  ): Promise<void> {
    await this.repository.update(
      { account_id: accountId, status: 'ACTIVE' },
      {
        status: 'REVOKED',
        revoked_at: new Date(),
        revoked_by: revokedBy,
        revoke_reason: reason,
        updated_at: new Date(),
      },
    );
  }

  async incrementFailedAttempts(id: number): Promise<void> {
    await this.repository.increment({ id }, 'failed_login_attempts', 1);
    await this.repository.update(id, {
      last_failed_at: new Date(),
      updated_at: new Date(),
    });
  }

  async updateFcmToken(id: number, fcmToken: string): Promise<void> {
    await this.repository.update(id, {
      fcm_token: fcmToken,
      fcm_token_updated_at: new Date(),
      fcm_token_status: 'ACTIVE',
      updated_at: new Date(),
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: DeviceSession[]; total: number }> {
    const [data, total] = await this.repository.findAndCount({
      order: { last_login_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findExpiredSessions(): Promise<DeviceSession[]> {
    return await this.repository
      .createQueryBuilder('session')
      .where('session.status = :status', { status: 'ACTIVE' })
      .andWhere('session.expires_at < :now', { now: new Date() })
      .getMany();
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expired = await this.findExpiredSessions();
    if (expired.length === 0) return 0;

    const ids = expired.map((s) => s.id!);
    await this.repository
      .createQueryBuilder()
      .update()
      .set({ status: 'EXPIRED', updated_at: new Date() })
      .whereInIds(ids)
      .execute();

    return expired.length;
  }
}
