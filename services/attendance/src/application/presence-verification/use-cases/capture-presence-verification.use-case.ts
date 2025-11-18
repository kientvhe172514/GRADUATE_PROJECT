import { Inject, Injectable, Logger } from '@nestjs/common';
import { PresenceVerificationRepositoryPort } from '../../ports/presence-verification.repository.port';
import { PresenceVerificationRoundEntity } from '../../../domain/entities/presence-verification-round.entity';

@Injectable()
export class CapturePresenceVerificationUseCase {
  private readonly logger = new Logger(
    CapturePresenceVerificationUseCase.name,
  );

  constructor(
    @Inject('IPresenceVerificationRepository')
    private readonly verificationRepository: PresenceVerificationRepositoryPort,
  ) {}

  async execute(data: {
    employeeId: string;
    shiftId: string;
    roundNumber: number;
    imageUrl: string;
    location: { latitude: number; longitude: number };
  }): Promise<PresenceVerificationRoundEntity> {
    this.logger.log(`Capturing presence verification for employee ${data.employeeId}, shift ${data.shiftId}, round ${data.roundNumber}`);

    const verification = new PresenceVerificationRoundEntity({
      employee_id: Number(data.employeeId),
      shift_id: Number(data.shiftId),
      round_number: data.roundNumber,
      captured_at: new Date(),
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      is_valid: true,
      validation_status: 'VALID',
    });

    return await this.verificationRepository.create(verification);
  }
}
