import { Injectable, Inject } from '@nestjs/common';
import {
  DeviceSession,
  DeviceStatus,
  DevicePlatform,
  FcmTokenStatus,
} from '../../../domain/entities/device-session.entity';
import { DeviceSessionRepositoryPort } from '../../ports/device-session.repository.port';
import { EventPublisherPort } from '../../ports/event.publisher.port';
import { DEVICE_SESSION_REPOSITORY, EVENT_PUBLISHER } from '../../tokens';
import { DeviceSessionCreatedEvent } from '../../../domain/events/device-session-created.event';

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
    private readonly deviceSessionRepo: DeviceSessionRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: CreateDeviceSessionDto): Promise<DeviceSession> {
    // Check if device already exists
    const existingDevice = await this.deviceSessionRepo.findActiveByDeviceId(
      dto.device_id,
    );

    if (existingDevice) {
      console.log('🔄 [DEVICE_SESSION] Updating existing device session:', {
        id: existingDevice.id,
        device_id: existingDevice.device_id,
        old_fcm_token: existingDevice.fcm_token ? '✅ EXISTS' : '❌ NULL',
        new_fcm_token: dto.fcm_token ? '✅ PROVIDED' : '❌ NOT PROVIDED',
      });

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

      const updatedDevice = await this.deviceSessionRepo.update(
        existingDevice.id!,
        existingDevice,
      );

      // ✅ ALWAYS publish event if FCM token exists and employee_id exists
      // This ensures notification service always has the latest FCM token
      if (updatedDevice.fcm_token && updatedDevice.employee_id) {
        try {
          console.log('🚀 [EVENT] Publishing device_session_created event (update with FCM token)...');
          const eventData = new DeviceSessionCreatedEvent(
            updatedDevice.id!,
            updatedDevice.account_id,
            updatedDevice.employee_id,
            updatedDevice.device_id,
            updatedDevice.fcm_token,
            updatedDevice.platform,
          );
          console.log('📤 [EVENT] Event payload:', JSON.stringify(eventData, null, 2));
          
          this.eventPublisher.publish('device_session_created', eventData);
          
          console.log('✅ [EVENT] Event published successfully!');
        } catch (error) {
          console.error('❌ [EVENT] Failed to publish device session created event:', error);
        }
      } else {
        console.log('⏭️ [EVENT] Skipping event publish - missing fcm_token or employee_id:', {
          has_fcm_token: !!updatedDevice.fcm_token,
          has_employee_id: !!updatedDevice.employee_id,
        });
      }

      return updatedDevice;
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

    const savedDevice = await this.deviceSessionRepo.create(newDevice as DeviceSession);

    // Publish event for notification service to sync FCM token
    console.log('📱 [DEVICE_SESSION] Device session created:', {
      id: savedDevice.id,
      employee_id: savedDevice.employee_id,
      device_id: savedDevice.device_id,
      fcm_token: savedDevice.fcm_token ? '✅ YES' : '❌ NO',
      platform: savedDevice.platform,
    });

    if (savedDevice.fcm_token && savedDevice.employee_id) {
      try {
        console.log('🚀 [EVENT] Publishing device_session_created event...');
        const eventData = new DeviceSessionCreatedEvent(
          savedDevice.id!,
          savedDevice.account_id,
          savedDevice.employee_id,
          savedDevice.device_id,
          savedDevice.fcm_token,
          savedDevice.platform,
        );
        console.log('📤 [EVENT] Event payload:', JSON.stringify(eventData, null, 2));
        
        this.eventPublisher.publish('device_session_created', eventData);
        
        console.log('✅ [EVENT] Event published successfully!');
      } catch (error) {
        console.error('❌ [EVENT] Failed to publish device session created event:', error);
        // Don't fail the request if event publishing fails
      }
    } else {
      console.warn('⚠️ [EVENT] Skipping event publish - missing fcm_token or employee_id:', {
        has_fcm_token: !!savedDevice.fcm_token,
        has_employee_id: !!savedDevice.employee_id,
        fcm_token_value: savedDevice.fcm_token || 'null',
        employee_id_value: savedDevice.employee_id || 'null',
      });
    }

    return savedDevice;
  }
}
