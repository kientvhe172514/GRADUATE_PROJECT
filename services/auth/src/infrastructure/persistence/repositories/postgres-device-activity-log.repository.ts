import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceActivityLogSchema } from '../typeorm/device-activity-log.schema';
import { DeviceActivityLogRepositoryPort } from '../../../application/ports/device-activity-log.repository.port';
import {
  DeviceActivityLog,
  ActivityType,
} from '../../../domain/entities/device-activity-log.entity';

@Injectable()
export class PostgresDeviceActivityLogRepository
  implements DeviceActivityLogRepositoryPort
{
  constructor(
    @InjectRepository(DeviceActivityLogSchema)
    private repository: Repository<any>,
  ) {}

  async create(log: DeviceActivityLog): Promise<DeviceActivityLog> {
    const saved = await this.repository.save(log);
    return saved;
  }

  async findByAccountId(
    account_id: number,
    limit?: number,
  ): Promise<DeviceActivityLog[]> {
    const query = this.repository
      .createQueryBuilder('log')
      .where('log.account_id = :account_id', { account_id })
      .orderBy('log.created_at', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return await query.getMany();
  }

  async findByDeviceSessionId(
    device_session_id: number,
    limit?: number,
  ): Promise<DeviceActivityLog[]> {
    const query = this.repository
      .createQueryBuilder('log')
      .where('log.device_session_id = :device_session_id', {
        device_session_id,
      })
      .orderBy('log.created_at', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return await query.getMany();
  }

  async findByActivityType(
    account_id: number,
    activity_type: ActivityType,
    limit?: number,
  ): Promise<DeviceActivityLog[]> {
    const query = this.repository
      .createQueryBuilder('log')
      .where('log.account_id = :account_id', { account_id })
      .andWhere('log.activity_type = :activity_type', { activity_type })
      .orderBy('log.created_at', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return await query.getMany();
  }

  async findSuspiciousActivities(
    account_id: number,
    hours: number,
  ): Promise<DeviceActivityLog[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return await this.repository
      .createQueryBuilder('log')
      .where('log.account_id = :account_id', { account_id })
      .andWhere('log.is_suspicious = :suspicious', { suspicious: true })
      .andWhere('log.created_at >= :cutoffTime', { cutoffTime })
      .orderBy('log.created_at', 'DESC')
      .getMany();
  }

  async countFailedLogins(account_id: number, minutes: number): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    return await this.repository
      .createQueryBuilder('log')
      .where('log.account_id = :account_id', { account_id })
      .andWhere('log.activity_type = :type', { type: 'LOGIN' })
      .andWhere('log.status = :status', { status: 'FAILED' })
      .andWhere('log.created_at >= :cutoffTime', { cutoffTime })
      .getCount();
  }

  async countFailedLoginsByIp(
    ip_address: string,
    minutes: number,
  ): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    return await this.repository
      .createQueryBuilder('log')
      .where('log.ip_address = :ip_address', { ip_address })
      .andWhere('log.activity_type = :type', { type: 'LOGIN' })
      .andWhere('log.status = :status', { status: 'FAILED' })
      .andWhere('log.created_at >= :cutoffTime', { cutoffTime })
      .getCount();
  }

  async findRecentActivitiesByIp(
    ip_address: string,
    hours: number,
  ): Promise<DeviceActivityLog[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return await this.repository
      .createQueryBuilder('log')
      .where('log.ip_address = :ip_address', { ip_address })
      .andWhere('log.created_at >= :cutoffTime', { cutoffTime })
      .orderBy('log.created_at', 'DESC')
      .getMany();
  }
}
