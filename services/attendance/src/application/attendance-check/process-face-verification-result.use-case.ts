import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
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
    private readonly dataSource: DataSource,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
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

      // 📲 Send success notification to employee
      this.notificationClient.emit('attendance.check.success', {
        employeeId: event.employee_id,
        attendanceCheckId: event.attendance_check_id,
        checkType: 'check_in', // Will be updated below based on actual check_type
        confidence: event.face_confidence,
        timestamp: event.verification_time.toISOString(),
      });

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

          // 📲 Send CHECK-IN success notification with details
          this.notificationClient.emit('attendance.check_in.success', {
            employeeId: event.employee_id,
            attendanceCheckId: event.attendance_check_id,
            shiftId: attendanceCheck.shift_id,
            checkInTime: event.verification_time.toISOString(),
            lateMinutes: lateMinutes,
            scheduledStartTime: shift.scheduled_start_time,
            confidence: event.face_confidence,
          });
        } else if (checkType === 'check_out') {
          // ✅ VALIDATE GPS ROUNDS BEFORE ALLOWING CHECK-OUT
          if (shift.presence_verification_required) {
            // Query presence_verification_rounds to get completed rounds data
            const gpsRounds = await this.dataSource.query(
              `
              SELECT 
                COUNT(*) as total_rounds,
                COUNT(*) FILTER (WHERE is_valid = true AND validation_status = 'VALID') as valid_rounds
              FROM presence_verification_rounds
              WHERE shift_id = $1
            `,
              [attendanceCheck.shift_id],
            );

            const roundsCompleted = parseInt(gpsRounds[0]?.total_rounds || '0');
            const validRounds = parseInt(gpsRounds[0]?.valid_rounds || '0');
            const roundsRequired =
              shift.presence_verification_rounds_required || 0;

            // Calculate % GPS VALID (số lần GPS hợp lệ / tổng số lần check)
            const gpsValidPercentage =
              roundsCompleted > 0 ? (validRounds / roundsCompleted) * 100 : 0;

            // ✅ Query min_gps_verification_percentage from config table
            const configResult = await this.dataSource.query(
              `
              SELECT min_gps_verification_percentage
              FROM gps_check_configurations
              WHERE is_active = true
                AND is_default = true
                AND (shift_type = $1 OR shift_type = 'ALL')
              ORDER BY 
                CASE WHEN shift_type = $1 THEN 1 ELSE 2 END,
                priority DESC
              LIMIT 1
            `,
              [shift.shift_type],
            );

            const minValidPercentage =
              parseFloat(
                configResult[0]?.min_gps_verification_percentage || '60',
              ) || 60;

            this.logger.log(
              `🔍 GPS Validation for checkout (shift_id=${attendanceCheck.shift_id}):
               - Rounds required: ${roundsRequired}
               - Rounds completed: ${roundsCompleted}
               - Valid checks: ${validRounds}
               - Valid percentage: ${gpsValidPercentage.toFixed(1)}%
               - Required minimum valid %: ${minValidPercentage}%`,
            );

            // ✅ CHECK 1: Phải hoàn thành ĐỦ SỐ ROUNDS YÊU CẦU
            if (roundsCompleted < roundsRequired) {
              // ❌ MARK SHIFT AS ABSENT - Chưa đủ số rounds GPS check
              await this.employeeShiftRepository.update(
                attendanceCheck.shift_id,
                {
                  status: 'ABSENT',
                  notes: `Vắng mặt: Không đủ số lần GPS verification. Đã hoàn thành: ${roundsCompleted}/${roundsRequired} rounds. Nhân viên có thể đã rời khỏi văn phòng trước khi hoàn thành ca làm việc.`,
                },
              );

              await this.attendanceCheckRepository.updateFaceVerification(
                event.attendance_check_id,
                {
                  face_verified: finalVerified,
                  face_confidence: event.face_confidence,
                  is_valid: false,
                  notes: `Check-out rejected: Insufficient GPS rounds completed (${roundsCompleted}/${roundsRequired}). Shift marked as ABSENT.`,
                },
              );

              this.logger.warn(
                `❌ SHIFT MARKED ABSENT (shift_id=${attendanceCheck.shift_id}): Insufficient GPS rounds (${roundsCompleted}/${roundsRequired})`,
              );

              this.notificationClient.emit('attendance.shift.marked_absent', {
                employeeId: event.employee_id,
                attendanceCheckId: event.attendance_check_id,
                shiftId: attendanceCheck.shift_id,
                reason: 'GPS_ROUNDS_INCOMPLETE',
                roundsCompleted,
                roundsRequired,
                message: `Ca làm việc của bạn đã bị đánh dấu VẮNG MẶT do không đủ số lần xác minh GPS. Đã hoàn thành: ${roundsCompleted}/${roundsRequired} lần. Vui lòng liên hệ HR để được hỗ trợ.`,
              });

              return; // ❌ STOP - Don't allow checkout
            }

            // ✅ CHECK 2: TRONG SỐ ROUNDS ĐÃ HOÀN THÀNH phải có ít nhất X% hợp lệ
            if (gpsValidPercentage < minValidPercentage) {
              // ❌ MARK SHIFT AS ABSENT - Tỷ lệ GPS hợp lệ không đạt
              await this.employeeShiftRepository.update(
                attendanceCheck.shift_id,
                {
                  status: 'ABSENT',
                  notes: `Vắng mặt: Tỷ lệ GPS hợp lệ không đạt yêu cầu. Đã check: ${roundsCompleted} lần, hợp lệ: ${validRounds} lần (${gpsValidPercentage.toFixed(1)}%). Yêu cầu tối thiểu: ${minValidPercentage}%. Nhân viên có thể đã không ở văn phòng trong suốt ca làm việc.`,
                },
              );

              await this.attendanceCheckRepository.updateFaceVerification(
                event.attendance_check_id,
                {
                  face_verified: finalVerified,
                  face_confidence: event.face_confidence,
                  is_valid: false,
                  notes: `Check-out rejected: GPS valid percentage too low (${validRounds}/${roundsCompleted} = ${gpsValidPercentage.toFixed(1)}%). Required: ${minValidPercentage}%. Shift marked as ABSENT.`,
                },
              );

              this.logger.warn(
                `❌ SHIFT MARKED ABSENT (shift_id=${attendanceCheck.shift_id}): GPS valid percentage insufficient (${gpsValidPercentage.toFixed(1)}% < ${minValidPercentage}%)`,
              );

              this.notificationClient.emit('attendance.shift.marked_absent', {
                employeeId: event.employee_id,
                attendanceCheckId: event.attendance_check_id,
                shiftId: attendanceCheck.shift_id,
                reason: 'GPS_VALID_PERCENTAGE_TOO_LOW',
                roundsCompleted,
                validRounds,
                roundsRequired,
                gpsValidPercentage: gpsValidPercentage.toFixed(1),
                minValidPercentageRequired: minValidPercentage,
                message: `Ca làm việc của bạn đã bị đánh dấu VẮNG MẶT do tỷ lệ GPS hợp lệ không đạt. Đã check: ${roundsCompleted} lần, hợp lệ: ${validRounds} lần (${gpsValidPercentage.toFixed(1)}%). Yêu cầu: ${minValidPercentage}%. Vui lòng liên hệ HR để được hỗ trợ.`,
              });

              return; // ❌ STOP - Don't allow checkout
            }

            // ✅ PASSED ALL GPS CHECKS
            this.logger.log(
              `✅ GPS Validation PASSED: ${roundsCompleted}/${roundsRequired} rounds completed, ${validRounds} valid (${gpsValidPercentage.toFixed(1)}% >= ${minValidPercentage}%)`,
            );
          }
          
          // ✅ GPS validation passed (or not required) → Now set COMPLETED and calculate work hours
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

            // ✅ NOW set status to COMPLETED (after GPS validation passed)
            await this.employeeShiftRepository.update(
              attendanceCheck.shift_id,
              {
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

            // 📲 Send CHECK-OUT success notification with work summary
            this.notificationClient.emit('attendance.check_out.success', {
              employeeId: event.employee_id,
              attendanceCheckId: event.attendance_check_id,
              shiftId: attendanceCheck.shift_id,
              checkOutTime: event.verification_time.toISOString(),
              workHours: actualWorkHours,
              overtimeHours: overtimeHours,
              earlyLeaveMinutes: earlyLeaveMinutes,
              scheduledEndTime: shift.scheduled_end_time,
              confidence: event.face_confidence,
            });

            // 📤 Publish SHIFT-COMPLETED event for Reporting Service
            this.notificationClient.emit('attendance.shift-completed', {
              shiftId: attendanceCheck.shift_id,
              employeeId: event.employee_id,
              employeeCode: event.employee_code,
              departmentId: shift.department_id,
              shiftDate: shift.shift_date.toISOString(),
              shiftType: shift.shift_type,
              scheduledStartTime: shift.scheduled_start_time,
              scheduledEndTime: shift.scheduled_end_time,
              checkInTime: shift.check_in_time?.toISOString(),
              checkOutTime: event.verification_time.toISOString(),
              workHours: actualWorkHours,
              overtimeHours: overtimeHours,
              lateMinutes: shift.late_minutes || 0,
              earlyLeaveMinutes: earlyLeaveMinutes,
              breakHours: shift.break_hours || 1,
              status: 'COMPLETED',
            });
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

      // 📲 Send FAILURE notification to employee
      this.notificationClient.emit('attendance.check.failed', {
        employeeId: event.employee_id,
        attendanceCheckId: event.attendance_check_id,
        confidence: event.face_confidence,
        minimumRequired: this.MINIMUM_CONFIDENCE,
        errorMessage: event.error_message || `Face confidence too low (${event.face_confidence} < ${this.MINIMUM_CONFIDENCE})`,
        timestamp: event.verification_time.toISOString(),
      });

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
