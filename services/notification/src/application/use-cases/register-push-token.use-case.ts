import { Inject, Injectable, Logger, ConflictException } from '@nestjs/common';
import { PushToken } from '../../domain/entities/push-token.entity';
import { PushTokenRepositoryPort } from '../ports/push-token.repository.port';
import { RegisterPushTokenDto } from '../dtos/push-token.dto';

export const PUSH_TOKEN_REPOSITORY = 'PUSH_TOKEN_REPOSITORY';

@Injectable()
export class RegisterPushTokenUseCase {
  private readonly logger = new Logger(RegisterPushTokenUseCase.name);

  constructor(
    @Inject(PUSH_TOKEN_REPOSITORY)
    private readonly pushTokenRepo: PushTokenRepositoryPort,
  ) {}

  async execute(employeeId: number, dto: RegisterPushTokenDto): Promise<PushToken> {
    this.logger.log(`Registering push token for employee ${employeeId}, device: ${dto.deviceId}`);

    // Check if device already registered
    const existing = await this.pushTokenRepo.findByDeviceId(employeeId, dto.deviceId);

    if (existing) {
      // Update existing token
      if (existing.token !== dto.token) {
        existing.token = dto.token;
        existing.platform = dto.platform;
        existing.activate();
        return await this.pushTokenRepo.update(existing);
      }
      existing.updateLastUsed();
      return await this.pushTokenRepo.update(existing);
    }

    // Create new token
    const pushToken = new PushToken({
      employeeId,
      deviceId: dto.deviceId,
      token: dto.token,
      platform: dto.platform,
      isActive: true,
    });

    return await this.pushTokenRepo.create(pushToken);
  }
}
