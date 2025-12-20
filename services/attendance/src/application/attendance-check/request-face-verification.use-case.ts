import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, of, retry } from 'rxjs';
import { AttendanceCheckRepository } from '../../infrastructure/repositories/attendance-check.repository';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { ValidateBeaconUseCase } from './validate-beacon.use-case';
import { ValidateGpsUseCase } from './validate-gps.use-case';
import { UpdateEmployeeShiftUseCase } from '../employee-shift/update-employee-shift.use-case';
import { GpsCheckCalculatorService } from '../services/gps-check-calculator.service';
import { getVietnamTime } from '../../common/utils/vietnam-time.util';

export interface RequestFaceVerificationCommand {
  employee_id: number;
  employee_code: string;
  department_id: number;
  session_token: string;
  check_type: 'check_in' | 'check_out';
  shift_date: Date;
  // GPS data (REQUIRED)
  latitude: number;
  longitude: number;
  location_accuracy?: number;
  // Device info
  device_id?: string;
  ip_address?: string;
  // Face data (optional - if provided, Face Service will verify; if omitted, auto-approved)
  face_embedding_base64?: string;
}

export interface FaceVerificationRequestEvent {
  employee_id: number;
  employee_code: string;
  attendance_check_id: number;
  shift_id: number;
  check_type: 'check_in' | 'check_out';
  request_time: Date;
  face_embedding_base64?: string; // 🆕 Face embedding for verification
}

@Injectable()
export class RequestFaceVerificationUseCase {
  private readonly logger = new Logger(RequestFaceVerificationUseCase.name);

  constructor(
    private readonly attendanceCheckRepository: AttendanceCheckRepository,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    private readonly validateBeaconUseCase: ValidateBeaconUseCase,
    private readonly validateGpsUseCase: ValidateGpsUseCase,
    private readonly updateEmployeeShiftUseCase: UpdateEmployeeShiftUseCase,
    private readonly gpsCheckCalculator: GpsCheckCalculatorService,
    private readonly configService: ConfigService,
    @Inject('FACE_RECOGNITION_SERVICE')
    private readonly faceRecognitionClient: ClientProxy,
    @Inject('EMPLOYEE_SERVICE')
    private readonly employeeClient: ClientProxy,
  ) {}

  async execute(command: RequestFaceVerificationCommand): Promise<{
    success: boolean;
    attendance_check_id?: number;
    shift_id?: number;
    message: string;
  }> {
    this.logger.log(
      `Processing ${command.check_type} request for employee ${command.employee_code}`,
    );

    // Step 1: Validate session token (beacon already validated) - Now using Redis
    const sessionValidation = await this.validateBeaconUseCase.validateSession(
      command.session_token,
      command.employee_id,
    );

    if (!sessionValidation.valid) {
      throw new BadRequestException(sessionValidation.error);
    }

    // Step 2: Get office coordinates from employee's department (via Employee Service)
    const { office_latitude, office_longitude, max_distance_meters } =
      await this.getOfficeCoordinates(command.employee_id);

    // Step 3: Validate GPS (REQUIRED for check-in/checkout)
    const gpsResult = this.validateGpsUseCase.execute({
      latitude: command.latitude,
      longitude: command.longitude,
      location_accuracy: command.location_accuracy,
      office_latitude,
      office_longitude,
      max_distance_meters,
    });

    const gpsValidated = gpsResult.is_valid;
    let distanceFromOffice: number | undefined = gpsResult.distance_from_office_meters;

    if (!gpsValidated) {
      this.logger.warn(
        `❌ GPS validation FAILED for employee ${command.employee_code}: ${gpsResult.message}`,
      );
      // ❌ REJECT check-in/out if GPS is invalid
      return {
        success: false,
        message: `GPS validation failed: ${gpsResult.message}`,
      };
    }

    this.logger.log(
      `✅ GPS validation PASSED for employee ${command.employee_code}: distance=${gpsResult.distance_from_office_meters.toFixed(2)}m`,
    );

    // Prevent numeric overflow when writing to DB columns with limited precision
    // attendance_check_records.distance_from_office_meters is decimal(7,2) -> max 99999.99
    const DISTANCE_MAX = 99999.99;
    if (distanceFromOffice !== undefined && distanceFromOffice !== null) {
      if (!isFinite(distanceFromOffice) || Number.isNaN(distanceFromOffice)) {
        distanceFromOffice = undefined;
      } else if (distanceFromOffice > DISTANCE_MAX) {
        this.logger.warn(
          `Distance from office (${distanceFromOffice}m) exceeds column max; capping to ${DISTANCE_MAX}m`,
        );
        distanceFromOffice = DISTANCE_MAX;
      }
    }

    // Step 3: Find employee shift using SMART TIME-BASED MATCHING
    // Logic:
    // - Check-in window: 2h BEFORE to 2h AFTER shift start (e.g., 8h shift → 6h-10h)
    // - If past (shift start + 2h) without check-in → Shift is MISSED → Move to next shift
    // - Multiple shifts per day: Auto-detect next available shift
    // - Priority: Ongoing shift (has check-in) > New shift (no check-in) > OVERTIME > REGULAR

    const currentTime = new Date().toTimeString().substring(0, 5); // "HH:MM"

    const shift = await this.employeeShiftRepository.findActiveShiftByTime(
      command.employee_id,
      command.shift_date,
      currentTime,
    );

    if (!shift) {
      // ❌ No shift found → Could be:
      // 1. No shift scheduled today
      // 2. All shifts today are MISSED (past check-in window without check-in)
      // 3. Current time is outside any shift's valid time range
      this.logger.warn(
        `No active shift found for employee ${command.employee_code} on ${command.shift_date.toISOString()} at ${currentTime}. ` +
        `Possible reasons: No shift scheduled, all shifts missed (past check-in deadline: shift_start + 2h), or outside valid time range.`,
      );
      return {
        success: false,
        message: `No active shift available for check-in/check-out at this time. ` +
          `Check-in window: 2 hours before to 2 hours after shift start time. ` +
          `If you missed this window, the shift is considered absent. Please contact your manager.`,
      };
    }

    // ✅ Found shift
    this.logger.log(
      `Found ${shift.shift_type} shift for employee ${command.employee_code}: ` +
        `${shift.scheduled_start_time}-${shift.scheduled_end_time} (shift_id=${shift.id}, current_time=${currentTime})`,
    );

    // ✅ BUSINESS LOGIC:
    // 1. No check-in → CHECK-IN (window: 2h early to 1h late)
    // 2. Has check-in, within check-out window → CHECK-OUT (window: 30min early to 1h late)
    // 3. Has check-in, BEFORE check-out window → LOG ONLY (2nd scan, don't update)
    // 4. Has both check-in & check-out → LOG ONLY (already completed)
    
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;
    
    // Parse shift end time
    const [endHour, endMinute] = shift.scheduled_end_time.split(':').map(Number);
    let endMinutes = endHour * 60 + endMinute;
    
    // Handle overnight shift
    const [startHour] = shift.scheduled_start_time.split(':').map(Number);
    const startMinutes = startHour * 60 + (shift.scheduled_start_time.split(':')[1] ? parseInt(shift.scheduled_start_time.split(':')[1]) : 0);
    const isOvernightShift = endMinutes < startMinutes;
    
    if (isOvernightShift) {
      endMinutes += 1440; // Add 24 hours
    }
    
    let adjustedCurrentMinutes = currentMinutes;
    if (isOvernightShift && currentHour < 6) {
      adjustedCurrentMinutes += 1440;
    }
    
    // Check-out window: 30 minutes before to 1 hour after shift end
    const checkOutStartMinutes = endMinutes - 30; // 30min early
    const checkOutEndMinutes = endMinutes + 60; // 1h late
    
    let checkType: 'check_in' | 'check_out';
    let isLogOnly = false; // Flag for 2nd scan (no update)
    
    if (!shift.check_in_time) {
      // Case 1: No check-in yet → CHECK-IN
      checkType = 'check_in';
      this.logger.log('✅ Auto-detected: CHECK-IN (shift has no check-in yet)');
    } else if (!shift.check_out_time) {
      // Case 2: Has check-in, no check-out yet
      // Check if current time is within check-out window
      if (adjustedCurrentMinutes >= checkOutStartMinutes && adjustedCurrentMinutes <= checkOutEndMinutes) {
        // Within check-out window → CHECK-OUT
        checkType = 'check_out';
        this.logger.log(
          `✅ Auto-detected: CHECK-OUT (within window: ${shift.scheduled_end_time} ±30min/+1h, current: ${currentTime})`,
        );
      } else {
        // BEFORE check-out window → 2nd scan, LOG ONLY
        checkType = 'check_in'; // Dummy value
        isLogOnly = true;
        this.logger.log(
          `⚠️ 2nd scan detected: Already checked-in but NOT in check-out window yet. ` +
          `Current: ${currentTime}, Check-out window starts: ${Math.floor(checkOutStartMinutes / 60)}:${String(checkOutStartMinutes % 60).padStart(2, '0')}. ` +
          `LOG ONLY - No update.`,
        );
      }
    } else {
      // Case 3: Both check-in & check-out exist → LOG ONLY
      checkType = 'check_in'; // Dummy value
      isLogOnly = true;
      this.logger.log(
        `⚠️ Shift ${shift.id} already completed (both check-in & check-out exist). This is a 2nd scan - LOG ONLY (no update).`,
      );
    }

    // Step 4: Create attendance check record (link to shift)
    const attendanceCheck = await this.attendanceCheckRepository.create({
      employee_id: command.employee_id,
      employee_code: command.employee_code,
      department_id: command.department_id,
      shift_id: shift.id, // Link to shift (REGULAR or OVERTIME)
      check_type: checkType,
      beacon_validated: true,
      beacon_id: sessionValidation.beaconId!,
      gps_validated: gpsValidated,
      latitude: command.latitude,
      longitude: command.longitude,
      location_accuracy: command.location_accuracy,
      distance_from_office_meters: distanceFromOffice,
      device_id: command.device_id,
      ip_address: command.ip_address,
    });

    this.logger.log(
      `✅ Attendance check record created: ID=${attendanceCheck.id}, check_type=${checkType}, beacon_validated=true, gps_validated=${gpsValidated}`,
    );

    // Step 5: SYNC RPC face verification (immediate response)
    const rpcRequest = {
      employee_id: command.employee_id,
      employee_code: command.employee_code,
      attendance_check_id: attendanceCheck.id,
      shift_id: shift.id,
      check_type: checkType,
      request_time: getVietnamTime(), // ✅ Vietnam timezone (UTC+7)
      face_embedding_base64: command.face_embedding_base64,
    };

    // ✅ NEW: SYNC RPC call for immediate response
    this.logger.log(
      `📤 Sending SYNC RPC request: employee_id=${command.employee_id}, attendance_check_id=${attendanceCheck.id}`,
    );
    this.logger.debug(`📦 RPC Request payload: ${JSON.stringify(rpcRequest)}`);

    try {
      // 🔍 DEBUG: Log RPC call details before sending
      this.logger.debug(
        `🔍 [DEBUG] RPC Pattern: face.verification.verify, Queue: face_verification_rpc_queue`,
      );

      const faceResult = await firstValueFrom(
        this.faceRecognitionClient
          .send('face.verification.verify', rpcRequest)
          .pipe(
            timeout(30000), // ⬆️ Increased from 15s to 30s for RabbitMQ + MassTransit RPC
            catchError((error) => {
              this.logger.error(
                `❌ RPC failed after 30s: ${error?.message || error}`,
              );
              this.logger.error(
                `❌ Error type: ${error?.constructor?.name}, timeout: ${error?.name === 'TimeoutError'}`,
              );
              return of({
                success: false,
                attendance_check_id: attendanceCheck.id,
                employee_id: command.employee_id,
                face_verified: false,
                face_confidence: 0,
                error_message: error?.message || 'Unavailable',
                message: 'Service unavailable',
              });
            }),
          ),
      );

      this.logger.log(
        `✅ RPC Response received: face_verified=${faceResult.face_verified}, confidence=${faceResult.face_confidence}`,
      );
      this.logger.debug(
        `📦 Full RPC Response: ${JSON.stringify(faceResult)}`,
      );

      await this.attendanceCheckRepository.updateFaceVerification(
        attendanceCheck.id,
        {
          face_verified: faceResult.face_verified,
          face_confidence: faceResult.face_confidence,
        },
      );

      // ✅ Use auto-detected checkType (not command.check_type from client)
      if (faceResult.face_verified) {
        if (isLogOnly) {
          // 2nd scan after both check-in & check-out done → LOG ONLY, don't update shift
          this.logger.log(
            `⚠️ 2nd scan detected for shift ${shift.id}. Attendance record logged but shift NOT updated.`,
          );
        } else if (checkType === 'check_in') {
          await this.updateEmployeeShiftUseCase.executeCheckIn({
            shift_id: shift.id,
            check_in_time: getVietnamTime(), // ✅ Vietnam timezone (UTC+7)
            check_record_id: attendanceCheck.id,
          });
          this.logger.log(
            `✅ Updated shift ${shift.id}: check_in_time recorded`,
          );
        } else {
          // CHECK-OUT: Update check_out_time
          await this.updateEmployeeShiftUseCase.executeCheckOut({
            shift_id: shift.id,
            check_out_time: getVietnamTime(), // ✅ Vietnam timezone (UTC+7)
            check_record_id: attendanceCheck.id,
          });
          this.logger.log(
            `✅ Updated shift ${shift.id}: check_out_time recorded`,
          );
        }
      }

      const statusMsg = faceResult.face_verified
        ? `Face: ✅ (${(faceResult.face_confidence * 100).toFixed(1)}%)`
        : `Face: ❌`;

      // Build message based on action taken
      let actionMessage: string;
      if (isLogOnly) {
        actionMessage = '2nd scan recorded (no update)';
      } else if (checkType === 'check_in') {
        actionMessage = faceResult.face_verified
          ? 'Check-in successful'
          : 'Check-in failed';
      } else {
        actionMessage = faceResult.face_verified
          ? 'Check-out successful'
          : 'Check-out failed';
      }

      return {
        success: faceResult.face_verified,
        attendance_check_id: attendanceCheck.id,
        shift_id: shift.id,
        message: `${actionMessage}. Beacon: ✅ | GPS: ${gpsValidated ? '✅' : '⏭️'} | ${statusMsg}`,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${(error as Error).message}`);
      
      return {
        success: false,
        attendance_check_id: attendanceCheck.id,
        shift_id: shift.id,
        message: `${command.check_type} failed. Beacon: ✅ | Face: ❌`,
      };
    }
  }

  /**
   * Get office coordinates from Employee Service (via RPC) based on employee's department
   * Fallback to config defaults if Employee Service is unavailable
   */
  private async getOfficeCoordinates(employeeId: number): Promise<{
    office_latitude: number;
    office_longitude: number;
    max_distance_meters: number;
  }> {
    // Default values from config (fallback)
    let office_latitude = Number(
      this.configService.get<number>('OFFICE_LATITUDE') || 10.762622,
    );
    let office_longitude = Number(
      this.configService.get<number>('OFFICE_LONGITUDE') || 106.660172,
    );
    let max_distance_meters = Number(
      this.configService.get<number>('MAX_OFFICE_DISTANCE_METERS') || 500,
    );

    try {
      // Query Employee Service to get employee's department office coordinates
      // Using standard RPC pattern 'employee.get' (returns wrapped response)
      const response = await firstValueFrom(
        this.employeeClient
          .send('employee.get', { id: employeeId })
          .pipe(
            timeout(2500), // 2.5s timeout
            catchError((error) => {
              this.logger.debug(
                `Employee Service RPC failed: ${error?.message || 'Unknown error'}`,
              );
              return of(null); // Return null on error
            }),
          ),
      );

      // Extract employee from wrapped response: { status, statusCode, message, data }
      const employee = response?.data;
      
      if (
        employee &&
        employee.department &&
        employee.department.office_latitude &&
        employee.department.office_longitude
      ) {
        office_latitude = Number(employee.department.office_latitude);
        office_longitude = Number(employee.department.office_longitude);

        // Use department's office radius (Department schema field: office_radius_meters)
        if (employee.department.office_radius_meters) {
          max_distance_meters = Number(employee.department.office_radius_meters);
        }

        this.logger.log(
          `✅ Using office coordinates from Employee Service for employee ${employeeId}: ` +
            `[${office_latitude}, ${office_longitude}], radius: ${max_distance_meters}m`,
        );
      } else {
        this.logger.warn(
          `⚠️ Employee ${employeeId} department has no office coordinates. Using config defaults.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch employee detail from Employee Service: ${(error as Error).message}. Using config defaults.`,
      );
    }

    return { office_latitude, office_longitude, max_distance_meters };
  }

  /**
   * Parse time string (HH:MM) and combine with date
   */
  private parseTimeString(timeStr: string, referenceDate: Date): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(referenceDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
}
