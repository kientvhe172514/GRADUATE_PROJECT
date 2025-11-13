import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RegisterPushTokenUseCase } from '../../application/use-cases/register-push-token.use-case';
import { Platform } from '../../domain/entities/push-token.entity';

interface DeviceSessionCreatedPayload {
  deviceSessionId: number;
  accountId: number;
  employeeId: number | null;
  deviceId: string;
  fcmToken: string | null;
  platform: string;
}

@Controller()
export class DeviceSessionCreatedListener {
  private readonly logger = new Logger(DeviceSessionCreatedListener.name);

  constructor(
    private readonly registerPushTokenUseCase: RegisterPushTokenUseCase,
  ) {}

  @EventPattern('device_session_created')
  async handleDeviceSessionCreated(
    @Payload() data: DeviceSessionCreatedPayload,
  ): Promise<void> {
    this.logger.log(
      `Received device_session_created event for employee ${data.employeeId}, device: ${data.deviceId}`,
    );

    if (!data.fcmToken || !data.employeeId) {
      this.logger.warn(
        `Skipping FCM token registration - missing fcmToken or employeeId`,
      );
      return;
    }

    try {
      // Map platform string to Platform enum
      let platform: Platform = Platform.WEB;
      if (data.platform === 'IOS' || data.platform === 'MOBILE_IOS') {
        platform = Platform.IOS;
      } else if (data.platform === 'ANDROID' || data.platform === 'MOBILE_ANDROID') {
        platform = Platform.ANDROID;
      }

      // Register/update FCM token
      await this.registerPushTokenUseCase.execute(data.employeeId, {
        deviceId: data.deviceId,
        deviceSessionId: data.deviceSessionId,
        token: data.fcmToken,
        platform: platform,
      });

      this.logger.log(
        `Successfully registered FCM token for device session ${data.deviceSessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to register FCM token for device session ${data.deviceSessionId}:`,
        error,
      );
      // Don't throw - event processing should continue
    }
  }
}
