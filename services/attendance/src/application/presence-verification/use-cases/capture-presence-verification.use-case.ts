import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PresenceVerificationRepositoryPort } from '../../ports/presence-verification.repository.port';
import { PresenceVerificationRoundEntity } from '../../../domain/entities/presence-verification-round.entity';
import { EmployeeShiftSchema } from '../../../infrastructure/persistence/typeorm/employee-shift.schema';

@Injectable()
export class CapturePresenceVerificationUseCase {
  private readonly logger = new Logger(CapturePresenceVerificationUseCase.name);

  constructor(
    @Inject('IPresenceVerificationRepository')
    private readonly verificationRepository: PresenceVerificationRepositoryPort,
    @InjectRepository(EmployeeShiftSchema)
    private readonly employeeShiftRepository: Repository<EmployeeShiftSchema>,
  ) {}

  async execute(data: {
    employeeId: string;
    shiftId: string;
    roundNumber: number;
    imageUrl: string;
    location: { latitude: number; longitude: number };
    validation?: {
      is_valid: boolean;
      distance_from_office_meters: number;
      location_accuracy?: number;
      validation_status: 'VALID' | 'INVALID' | 'OUT_OF_RANGE' | 'SUSPICIOUS';
      validation_reason?: string;
    };
  }): Promise<PresenceVerificationRoundEntity> {
    this.logger.log(
      `Capturing presence verification for employee ${data.employeeId}, shift ${data.shiftId}, round ${data.roundNumber}`,
    );

    const verification = new PresenceVerificationRoundEntity({
      employee_id: Number(data.employeeId),
      shift_id: Number(data.shiftId),
      round_number: data.roundNumber,
      captured_at: new Date(),
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      // Use validation data if provided, otherwise default to valid
      is_valid: data.validation?.is_valid ?? true,
      validation_status: data.validation?.validation_status ?? 'VALID',
      distance_from_office_meters: data.validation?.distance_from_office_meters,
      location_accuracy: data.validation?.location_accuracy,
      validation_reason: data.validation?.validation_reason,
    });

    const savedVerification =
      await this.verificationRepository.create(verification);

    // ✅ FIX: Cập nhật counter trong employee_shifts table
    try {
      await this.employeeShiftRepository.increment(
        { id: Number(data.shiftId) },
        'presence_verification_rounds_completed',
        1,
      );
      
      this.logger.log(
        `✅ Incremented presence_verification_rounds_completed for shift ${data.shiftId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment verification counter for shift ${data.shiftId}: ${error.message}`,
      );
    }

    return savedVerification;
  }
}
