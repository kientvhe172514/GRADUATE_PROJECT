import { Injectable, Logger } from '@nestjs/common';
import { AttendanceCheckRepository } from '../../infrastructure/persistence/repositories/attendance-check.repository';

export interface FaceVerificationResultEvent {
  attendance_check_id: number;
  employee_id: number;
  employee_code: string;
  face_verified: boolean;
  face_confidence: number;
  verification_time: Date;
  error_message?: string;
}

@Injectable()
export class ProcessFaceVerificationResultUseCase {
  private readonly logger = new Logger(ProcessFaceVerificationResultUseCase.name);
  private readonly MINIMUM_CONFIDENCE = 0.85;

  constructor(
    private readonly attendanceCheckRepository: AttendanceCheckRepository,
  ) {}

  async execute(event: FaceVerificationResultEvent): Promise<void> {
    this.logger.log(
      `Processing face verification result for attendance_check_id=${event.attendance_check_id}, ` +
        `employee_id=${event.employee_id}, face_verified=${event.face_verified}, confidence=${event.face_confidence}`,
    );

    // Validate confidence threshold
    const isValidConfidence = event.face_confidence >= this.MINIMUM_CONFIDENCE;
    const finalVerified = event.face_verified && isValidConfidence;

    if (event.face_verified && !isValidConfidence) {
      this.logger.warn(
        `Face verification confidence ${event.face_confidence} below threshold ${this.MINIMUM_CONFIDENCE} ` +
          `for attendance_check_id=${event.attendance_check_id}`,
      );
    }

    // Update attendance check record
    await this.attendanceCheckRepository.updateFaceVerification(
      event.attendance_check_id,
      {
        face_verified: finalVerified,
        face_confidence: event.face_confidence,
        verified_at: finalVerified ? event.verification_time : undefined,
        is_valid: finalVerified,
        notes: event.error_message
          ? `Face verification failed: ${event.error_message}`
          : isValidConfidence
            ? 'Face verification successful'
            : `Confidence ${event.face_confidence} below threshold ${this.MINIMUM_CONFIDENCE}`,
      },
    );

    if (finalVerified) {
      this.logger.log(
        `✅ Attendance check ${event.attendance_check_id} completed successfully for employee ${event.employee_code}`,
      );
      
      // TODO: Mark employee shift presence_verified = true
      // TODO: Trigger notification to employee
      // TODO: Update employee work hours
    } else {
      this.logger.warn(
        `❌ Attendance check ${event.attendance_check_id} failed for employee ${event.employee_code}: ` +
          (event.error_message || `Low confidence ${event.face_confidence}`),
      );
      
      // TODO: Trigger alert to HR department
      // TODO: Create anomaly record for investigation
    }
  }
}
