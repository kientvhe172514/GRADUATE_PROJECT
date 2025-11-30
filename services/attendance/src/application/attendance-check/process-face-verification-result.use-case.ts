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
        // Get shift to calculate late/early leave
        const shift = await this.employeeShiftRepository.findById(
          attendanceCheck.shift_id,
        );

        if (!shift) {
          this.logger.warn(
            `Shift ${attendanceCheck.shift_id} not found, cannot update`,
          );
          return;
        }

        // Update employee shift based on check_type
        // Normalize to lowercase to handle case mismatch
        const checkType = String(attendanceCheck.check_type).toLowerCase();
        if (checkType === 'check_in') {
          // Calculate late minutes
          const lateMinutes = this.calculateLateMinutes(
            event.verification_time,
            shift.shift_date,
            shift.scheduled_start_time,
          );

          await this.employeeShiftRepository.update(attendanceCheck.shift_id, {
            check_in_time: event.verification_time,
            check_in_record_id: event.attendance_check_id,
            late_minutes: lateMinutes,
            status: 'IN_PROGRESS',
          });
          this.logger.log(
            `✅ Updated shift ${attendanceCheck.shift_id}: check_in_time=${event.verification_time.toISOString()}, ` +
              `late_minutes=${lateMinutes}, status=IN_PROGRESS`,
          );
        } else if (checkType === 'check_out') {
          if (shift.check_in_time) {
            // Calculate work hours and overtime based on scheduled shift duration
            const { actualWorkHours, overtimeHours } =
              this.calculateWorkAndOvertimeHours(
                shift.check_in_time,
                event.verification_time,
                shift.shift_date,
                shift.scheduled_start_time,
                shift.scheduled_end_time,
              );

            // Calculate early leave minutes
            const earlyLeaveMinutes = this.calculateEarlyLeaveMinutes(
              event.verification_time,
              shift.shift_date,
              shift.scheduled_end_time,
            );

            await this.employeeShiftRepository.update(
              attendanceCheck.shift_id,
              {
                check_out_time: event.verification_time,
                check_out_record_id: event.attendance_check_id,
                work_hours: actualWorkHours,
                overtime_hours: overtimeHours,
                early_leave_minutes: earlyLeaveMinutes,
                status: 'COMPLETED',
              },
            );
            this.logger.log(
              `✅ Updated shift ${attendanceCheck.shift_id}: check_out_time=${event.verification_time.toISOString()}, ` +
                `work_hours=${actualWorkHours}h, overtime_hours=${overtimeHours}h, early_leave_minutes=${earlyLeaveMinutes}, status=COMPLETED`,
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

  /**
   * Calculate actual work hours and overtime hours based on scheduled shift
   * Business Rules:
   * 1. Work hours = time within scheduled shift (start to end)
   * 2. Don't count time BEFORE scheduled_start_time
   * 3. Don't count time AFTER scheduled_end_time as work_hours (it's overtime)
   * 4. Overtime = time after scheduled_end_time (if checked out late)
   *
   * Example: 6am check-in, 7pm check-out for 8am-5pm shift
   * - Work hours: 9h (8am-5pm)
   * - Overtime hours: 2h (5pm-7pm)
   */
  private calculateWorkAndOvertimeHours(
    checkInTime: Date,
    checkOutTime: Date,
    shiftDate: Date,
    scheduledStartTime: string, // Format: 'HH:mm:ss'
    scheduledEndTime: string, // Format: 'HH:mm:ss'
  ): { actualWorkHours: number; overtimeHours: number } {
    try {
      // Parse scheduled times
      const [startHour, startMin] = scheduledStartTime.split(':').map(Number);
      const [endHour, endMin] = scheduledEndTime.split(':').map(Number);

      const scheduledStart = new Date(shiftDate);
      scheduledStart.setHours(startHour, startMin, 0, 0);

      const scheduledEnd = new Date(shiftDate);
      scheduledEnd.setHours(endHour, endMin, 0, 0);

      // Handle overnight shifts (end time < start time)
      if (scheduledEnd <= scheduledStart) {
        scheduledEnd.setDate(scheduledEnd.getDate() + 1);
      }

      // Determine effective work start time (max of check_in and scheduled_start)
      // If check-in is 6am but shift starts at 8am, work starts at 8am
      const effectiveStartTime =
        checkInTime > scheduledStart ? checkInTime : scheduledStart;

      // Determine effective work end time (min of check_out and scheduled_end)
      // If check-out is 7pm but shift ends at 5pm, regular work ends at 5pm
      const effectiveEndTime =
        checkOutTime < scheduledEnd ? checkOutTime : scheduledEnd;

      // Calculate actual work hours (within scheduled shift)
      let actualWorkHours = 0;
      if (effectiveEndTime > effectiveStartTime) {
        actualWorkHours =
          (effectiveEndTime.getTime() - effectiveStartTime.getTime()) /
          (1000 * 60 * 60);
      }

      // Calculate overtime hours (time after scheduled_end_time)
      let overtimeHours = 0;
      if (checkOutTime > scheduledEnd) {
        overtimeHours =
          (checkOutTime.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60);
      }

      return {
        actualWorkHours: parseFloat(actualWorkHours.toFixed(2)),
        overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      };
    } catch (error) {
      this.logger.error(
        `❌ Error calculating work/overtime hours: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Fallback: simple difference
      const totalHours =
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      return {
        actualWorkHours: parseFloat(totalHours.toFixed(2)),
        overtimeHours: 0,
      };
    }
  }

  /**
   * Calculate late minutes if check-in is after scheduled start time
   * Returns 0 if on time or early, positive number if late
   */
  private calculateLateMinutes(
    checkInTime: Date,
    shiftDate: Date,
    scheduledStartTime: string,
  ): number {
    // Parse scheduled start time (format: "HH:mm:ss")
    const [hours, minutes] = scheduledStartTime.split(':').map(Number);
    const scheduledStart = new Date(shiftDate);
    scheduledStart.setHours(hours, minutes, 0, 0);

    // Calculate difference in minutes
    const diffMs = checkInTime.getTime() - scheduledStart.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Return 0 if on time or early, otherwise return late minutes
    return Math.max(0, diffMinutes);
  }

  /**
   * Calculate early leave minutes if check-out is before scheduled end time
   * Returns 0 if on time or late, positive number if left early
   */
  private calculateEarlyLeaveMinutes(
    checkOutTime: Date,
    shiftDate: Date,
    scheduledEndTime: string,
  ): number {
    // Parse scheduled end time (format: "HH:mm:ss")
    const [hours, minutes] = scheduledEndTime.split(':').map(Number);
    let scheduledEnd = new Date(shiftDate);
    scheduledEnd.setHours(hours, minutes, 0, 0);

    // Handle night shifts (end time < start time means next day)
    const [startHours] = scheduledEndTime.split(':').map(Number);
    if (hours < startHours) {
      scheduledEnd = new Date(scheduledEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    // Calculate difference in minutes
    const diffMs = scheduledEnd.getTime() - checkOutTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Return 0 if on time or stayed late, otherwise return early leave minutes
    return Math.max(0, diffMinutes);
  }
}
