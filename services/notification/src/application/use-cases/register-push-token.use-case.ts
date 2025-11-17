import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { PushToken } from '../../domain/entities/push-token.entity';
import { PushTokenRepositoryPort } from '../ports/push-token.repository.port';
import { RegisterPushTokenDto } from '../dtos/push-token.dto';

export const PUSH_TOKEN_REPOSITORY = 'PUSH_TOKEN_REPOSITORY';
export const AUTH_SERVICE_CLIENT = 'AUTH_SERVICE'; // RabbitMQ client to Auth Service

@Injectable()
export class RegisterPushTokenUseCase {
  private readonly logger = new Logger(RegisterPushTokenUseCase.name);

  constructor(
    @Inject(PUSH_TOKEN_REPOSITORY)
    private readonly pushTokenRepo: PushTokenRepositoryPort,
    @Inject(AUTH_SERVICE_CLIENT)
    private readonly authServiceClient: ClientProxy,
  ) {}

  async execute(employeeId: number, dto: RegisterPushTokenDto): Promise<PushToken> {
    this.logger.log(`Registering push token for employee ${employeeId}, device: ${dto.deviceId}`);

    // ✅ Use deviceSessionId from DTO if provided (from event), otherwise query Auth Service
    let deviceSessionId: number | undefined = dto.deviceSessionId;
    
    if (!deviceSessionId) {
      // Fallback: Query Auth Service if deviceSessionId not provided
      try {
        this.logger.debug(`Querying Auth Service for device_session_id (employee: ${employeeId}, device: ${dto.deviceId})`);
        
        const response = await firstValueFrom(
          this.authServiceClient.send('get_device_session', {
            employeeId,
            deviceId: dto.deviceId,
          }).pipe(
            timeout(3000), // 3s timeout
            catchError((error) => {
              this.logger.warn(`Auth Service RPC error: ${error.message}`);
              return [null]; // Return null if error
            })
          )
        );

        if (response && response.device_session_id) {
          deviceSessionId = response.device_session_id;
          this.logger.log(`✅ Found device_session_id: ${deviceSessionId} for device ${dto.deviceId}`);
        } else {
          this.logger.warn(`⚠️ Device session not found in Auth Service for device ${dto.deviceId}. Will proceed without linking.`);
        }
      } catch (error) {
        this.logger.warn(`⚠️ Could not fetch device_session_id from Auth Service: ${error.message}`);
        // Continue without device_session_id - device might not have logged in yet
      }
    } else {
      this.logger.log(`✅ Using deviceSessionId from event: ${deviceSessionId}`);
    }

    // Check if device already registered
    const existing = await this.pushTokenRepo.findByDeviceId(employeeId, dto.deviceId);

    if (existing) {
      // Update existing token
      const needsUpdate = 
        existing.token !== dto.token || 
        existing.platform !== dto.platform ||
        (deviceSessionId && existing.deviceSessionId !== deviceSessionId);

      if (needsUpdate) {
        existing.token = dto.token;
        existing.platform = dto.platform;
        if (deviceSessionId) {
          existing.deviceSessionId = deviceSessionId; // ✅ Update device_session_id if found
        }
        existing.activate();
        
        this.logger.log(`✅ Updated push token for employee ${employeeId}, device ${dto.deviceId}`);
        return await this.pushTokenRepo.update(existing);
      }
      
      // Just update last used time
      existing.updateLastUsed();
      this.logger.debug(`Updated last_used_at for device ${dto.deviceId}`);
      return await this.pushTokenRepo.update(existing);
    }

    // Create new token
    const pushToken = new PushToken({
      employeeId,
      deviceId: dto.deviceId,
      deviceSessionId, // ✅ Auto-linked with device session (if found)
      token: dto.token,
      platform: dto.platform,
      isActive: true,
    });

    this.logger.log(`✅ Created new push token for employee ${employeeId}, device ${dto.deviceId}, session: ${deviceSessionId || 'N/A'}`);
    return await this.pushTokenRepo.create(pushToken);
  }
}
