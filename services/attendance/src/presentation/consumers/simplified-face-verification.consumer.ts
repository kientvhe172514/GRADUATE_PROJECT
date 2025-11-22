import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AutoCheckAttendanceFromFaceUseCase } from '../../application/attendance-check/auto-check-attendance-from-face.use-case';
import { ProcessFaceVerificationResultUseCase } from '../../application/attendance-check/process-face-verification-result.use-case';

export interface SimplifiedFaceVerificationEvent {
  employee_id: number;
  face_verified: boolean;
  face_confidence: number;
  verification_time: Date;
  error_message?: string;
}

@Controller()
export class SimplifiedFaceVerificationConsumer {
  private readonly logger = new Logger(SimplifiedFaceVerificationConsumer.name);

  constructor(
    private readonly autoCheckUseCase: AutoCheckAttendanceFromFaceUseCase,
    private readonly processResultUseCase: ProcessFaceVerificationResultUseCase,
  ) {}

  @EventPattern('face_verification_completed')
  async handleFaceVerificationCompleted(
    @Payload() event: SimplifiedFaceVerificationEvent,
  ): Promise<void> {
    this.logger.log(
      `📨 Received simplified face_verification_completed event: ` +
        `employee_id=${event.employee_id}, verified=${event.face_verified}, confidence=${event.face_confidence}`,
    );

    try {
      // Step 1: Auto-create attendance check with smart CHECK_IN/CHECK_OUT logic
      const autoCheckResult = await this.autoCheckUseCase.execute({
        employee_id: event.employee_id,
      });

      this.logger.log(
        `✅ Auto-created attendance_check_id=${autoCheckResult.attendance_check_id} with ` +
          `check_type=${autoCheckResult.check_type} for employee_id=${event.employee_id}`,
      );

      // Step 2: Process face verification result for this attendance check
      await this.processResultUseCase.execute({
        attendance_check_id: autoCheckResult.attendance_check_id,
        employee_id: event.employee_id,
        employee_code: '', // Will be fetched from attendance_check record
        face_verified: event.face_verified,
        face_confidence: event.face_confidence,
        verification_time: event.verification_time,
        error_message: event.error_message,
      });

      this.logger.log(
        `✅ Successfully processed face verification for attendance_check_id=${autoCheckResult.attendance_check_id}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to process simplified face verification for employee_id=${event.employee_id}`,
        error.stack,
      );
      throw error;
    }
  }
}
