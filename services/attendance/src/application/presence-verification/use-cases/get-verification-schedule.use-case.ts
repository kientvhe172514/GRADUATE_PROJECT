import { Injectable, Logger } from '@nestjs/common';
import { PresenceVerificationRepositoryPort } from '../../ports/presence-verification.repository.port';
import { PresenceVerificationRoundEntity } from '../../../domain/entities/presence-verification-round.entity';

@Injectable()
export class GetVerificationScheduleUseCase {
  private readonly logger = new Logger(GetVerificationScheduleUseCase.name);

  constructor(
    private readonly verificationRepository: PresenceVerificationRepositoryPort,
  ) {}

  async execute(shiftId: string): Promise<PresenceVerificationRoundEntity[]> {
    this.logger.log(`Getting verification schedule for shift ${shiftId}`);
    return await this.verificationRepository.findByShiftId(Number(shiftId));
  }
}
