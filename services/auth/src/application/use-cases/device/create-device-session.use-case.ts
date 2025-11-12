import { Injectable, Inject } from '@nestjs/common';
import {
  DeviceSession,
  DeviceStatus,
  DevicePlatform,
  FcmTokenStatus,
} from '../../../domain/entities/device-session.entity';
import { DeviceSessionRepositoryPort } from '../../ports/device-session.repository.port';
import { DEVICE_SESSION_REPOSITORY } from '../../tokens';

export interface CreateDeviceSessionDto {
  account_id: number;
  employee_id?: number;
  device_id: string;
  device_name?: string;
  device_os?: string;
  device_model?: string;
  device_fingerprint?: string;
  platform: DevicePlatform;
  app_version?: string;
  ip_address?: string;
  location?: {
    country?: string;
    city?: string;
    lat?: number;
    lng?: number;
    timezone?: string;
  };
  user_agent?: string;
  fcm_token?: string;
}

@Injectable()
export class CreateDeviceSessionUseCase {
  constructor(
    @Inject(DEVICE_SESSION_REPOSITORY)
    private deviceSessionRepo: DeviceSessionRepositoryPort,
  ) {}

  async execute(dto: CreateDeviceSessionDto): Promise<DeviceSession> {
    // Check if device already exists
    const existingDevice = await this.deviceSessionRepo.findActiveByDeviceId(
      dto.device_id,
    );

    if (existingDevice) {
      // Update existing device session
      existingDevice.last_login_at = new Date();
      existingDevice.last_active_at = new Date();
      existingDevice.last_ip_address = dto.ip_address;
      existingDevice.last_location = dto.location;
      existingDevice.last_user_agent = dto.user_agent;
      existingDevice.device_name = dto.device_name || existingDevice.device_name;
      existingDevice.device_os = dto.device_os || existingDevice.device_os;
      existingDevice.device_model =
        dto.device_model || existingDevice.device_model;
      existingDevice.app_version = dto.app_version;
      existingDevice.login_count += 1;
      existingDevice.failed_login_attempts = 0;

      if (dto.fcm_token) {
        existingDevice.fcm_token = dto.fcm_token;
        existingDevice.fcm_token_updated_at = new Date();
        existingDevice.fcm_token_status = FcmTokenStatus.ACTIVE;
      }

      return await this.deviceSessionRepo.update(
        existingDevice.id!,
        existingDevice,
      );
    }

    // Create new device session
    const newDevice: Partial<DeviceSession> = {
      account_id: dto.account_id,
      employee_id: dto.employee_id,
      device_id: dto.device_id,
      device_name: dto.device_name,
      device_os: dto.device_os,
      device_model: dto.device_model,
      device_fingerprint: dto.device_fingerprint,
      platform: dto.platform,
      app_version: dto.app_version,
      is_trusted: false,
      first_login_at: new Date(),
      last_login_at: new Date(),
      last_active_at: new Date(),
      login_count: 1,
      failed_login_attempts: 0,
      last_ip_address: dto.ip_address,
      last_location: dto.location,
      last_user_agent: dto.user_agent,
      fcm_token: dto.fcm_token,
      fcm_token_updated_at: dto.fcm_token ? new Date() : undefined,
      fcm_token_status: dto.fcm_token ? FcmTokenStatus.ACTIVE : undefined,
      status: DeviceStatus.ACTIVE,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      created_at: new Date(),
      updated_at: new Date(),
    };

    return await this.deviceSessionRepo.create(newDevice as DeviceSession);
  }
}
