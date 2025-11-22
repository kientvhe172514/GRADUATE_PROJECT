import { Injectable, Logger } from '@nestjs/common';
import { AttendanceCheckRepository } from '../../infrastructure/repositories/attendance-check.repository';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';

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
  private readonly logger = new Logger(
    ProcessFaceVerificationResultUseCase.name,
  );
  private readonly MINIMUM_CONFIDENCE = 0.85;

  constructor(
    private readonly attendanceCheckRepository: AttendanceCheckRepository,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
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

      // Get attendance check to find shift_id and check_type
      const attendanceCheck = await this.attendanceCheckRepository.findById(
        event.attendance_check_id,
      );

      if (attendanceCheck && attendanceCheck.shift_id) {
        // Update employee shift based on check_type
        if (attendanceCheck.check_type === 'CHECK_IN') {
          await this.employeeShiftRepository.update(attendanceCheck.shift_id, {
            check_in_time: event.verification_time,
            check_in_record_id: event.attendance_check_id,
            status: 'IN_PROGRESS',
          });
          this.logger.log(
            `✅ Updated shift ${attendanceCheck.shift_id}: check_in_time=${event.verification_time.toISOString()}, status=IN_PROGRESS`,
          );
        } else if (attendanceCheck.check_type === 'CHECK_OUT') {
          // Get shift to calculate work hours
          const shift = await this.employeeShiftRepository.findById(
            attendanceCheck.shift_id,
          );

          if (shift && shift.check_in_time) {
            // Calculate work hours (difference between check_out and check_in)
            const workHours =
              (event.verification_time.getTime() -
                shift.check_in_time.getTime()) /
              (1000 * 60 * 60);

            await this.employeeShiftRepository.update(
              attendanceCheck.shift_id,
              {
                check_out_time: event.verification_time,
                check_out_record_id: event.attendance_check_id,
                work_hours: parseFloat(workHours.toFixed(2)),
                status: 'COMPLETED',
              },
            );
            this.logger.log(
              `✅ Updated shift ${attendanceCheck.shift_id}: check_out_time=${event.verification_time.toISOString()}, ` +
                `work_hours=${workHours.toFixed(2)}, status=COMPLETED`,
            );
          }
        }

        // TODO: Trigger notification to employee
        // TODO: Calculate overtime hours if applicable
      }
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
