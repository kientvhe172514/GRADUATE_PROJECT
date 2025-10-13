import { Inject, Injectable, Logger } from '@nestjs/common';
import { PushTokenRepositoryPort } from '../ports/push-token.repository.port';
import { UnregisterPushTokenDto } from '../dtos/push-token.dto';
import { PUSH_TOKEN_REPOSITORY } from './register-push-token.use-case';

@Injectable()
export class UnregisterPushTokenUseCase {
  private readonly logger = new Logger(UnregisterPushTokenUseCase.name);

  constructor(
    @Inject(PUSH_TOKEN_REPOSITORY)
    private readonly pushTokenRepo: PushTokenRepositoryPort,
  ) {}

  async execute(employeeId: number, dto: UnregisterPushTokenDto): Promise<void> {
    this.logger.log(`Unregistering push token for employee ${employeeId}`);

    if (dto.deviceId) {
      await this.pushTokenRepo.deactivateByDeviceId(employeeId, dto.deviceId);
      this.logger.log(`Deactivated push token for device ${dto.deviceId}`);
    }

    if (dto.token) {
      await this.pushTokenRepo.deactivateByToken(dto.token);
      this.logger.log(`Deactivated push token: ${dto.token}`);
    }
  }
}
