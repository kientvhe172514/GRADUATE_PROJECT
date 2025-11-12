import { Injectable, Inject } from '@nestjs/common';
import {
  DeviceActivityLog,
  ActivityType,
  ActivityStatus,
} from '../../../domain/entities/device-activity-log.entity';
import { DeviceActivityLogRepositoryPort } from '../../ports/device-activity-log.repository.port';
import { DEVICE_ACTIVITY_LOG_REPOSITORY } from '../../tokens';

export interface LogDeviceActivityDto {
  device_session_id?: number;
  account_id: number;
  activity_type: ActivityType;
  status: ActivityStatus;
  ip_address?: string;
  location?: {
    country?: string;
    city?: string;
    lat?: number;
    lng?: number;
    timezone?: string;
  };
  user_agent?: string;
  is_suspicious?: boolean;
  suspicious_reason?: string;
  risk_score?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class LogDeviceActivityUseCase {
  constructor(
    @Inject(DEVICE_ACTIVITY_LOG_REPOSITORY)
    private activityLogRepo: DeviceActivityLogRepositoryPort,
  ) {}

  async execute(dto: LogDeviceActivityDto): Promise<DeviceActivityLog> {
    const log: Partial<DeviceActivityLog> = {
      device_session_id: dto.device_session_id,
      account_id: dto.account_id,
      activity_type: dto.activity_type,
      status: dto.status,
      ip_address: dto.ip_address,
      location: dto.location,
      user_agent: dto.user_agent,
      is_suspicious: dto.is_suspicious || false,
      suspicious_reason: dto.suspicious_reason,
      risk_score: dto.risk_score,
      metadata: dto.metadata,
      created_at: new Date(),
    };

    return await this.activityLogRepo.create(log as DeviceActivityLog);
  }
}
