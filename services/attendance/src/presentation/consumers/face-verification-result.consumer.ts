import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  ProcessFaceVerificationResultUseCase,
  FaceVerificationResultEvent,
} from '../../application/attendance-check/process-face-verification-result.use-case';

@Controller()
export class FaceVerificationResultConsumer {
  private readonly logger = new Logger(FaceVerificationResultConsumer.name);

  constructor(
    private readonly processResultUseCase: ProcessFaceVerificationResultUseCase,
  ) {}

  @EventPattern('face_verification_completed')
  async handleFaceVerificationCompleted(
    @Payload() event: FaceVerificationResultEvent,
  ): Promise<void> {
    this.logger.log(
      `📨 Received face_verification_completed event: attendance_check_id=${event.attendance_check_id}, ` +
        `employee_id=${event.employee_id}, verified=${event.face_verified}, confidence=${event.face_confidence}`,
    );

    try {
      await this.processResultUseCase.execute(event);
      this.logger.log(
        `✅ Successfully processed face verification result for attendance_check_id=${event.attendance_check_id}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to process face verification result for attendance_check_id=${event.attendance_check_id}`,
        error.stack,
      );
      throw error;
    }
  }
}
