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
  // GPS data
  latitude?: number;
  longitude?: number;
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

    // Step 3: Validate GPS (if provided)
    let gpsValidated = false;
    let distanceFromOffice: number | undefined;

    if (command.latitude && command.longitude) {
      const gpsResult = this.validateGpsUseCase.execute({
        latitude: command.latitude,
        longitude: command.longitude,
        location_accuracy: command.location_accuracy,
        office_latitude,
        office_longitude,
        max_distance_meters,
      });

      gpsValidated = gpsResult.is_valid;
      distanceFromOffice = gpsResult.distance_from_office_meters;

      if (!gpsValidated) {
        this.logger.warn(
          `GPS validation failed for employee ${command.employee_code}: ${gpsResult.message}`,
        );
      }
    }

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
    // This handles:
    // - Early check-in (6am for 8am shift)
    // - Multiple shifts per day (8am-12pm, 1pm-5pm)
    // - Late check-in (within grace period)
    // Priority: OVERTIME > REGULAR (if both match)

    const currentTime = new Date().toTimeString().substring(0, 5); // "HH:MM"

    const shift = await this.employeeShiftRepository.findActiveShiftByTime(
      command.employee_id,
      command.shift_date,
      currentTime,
    );

    if (!shift) {
      // ❌ No shift found → Return error (do NOT auto-create)
      this.logger.warn(
        `No shift found for employee ${command.employee_code} on ${command.shift_date.toISOString()} at ${currentTime}`,
      );
      return {
        success: false,
        message: `You have no scheduled shift for today (${command.shift_date.toISOString().split('T')[0]}). Please contact HR.`,
      };
    }

    // ✅ Found shift
    this.logger.log(
      `Found ${shift.shift_type} shift for employee ${command.employee_code}: ` +
        `${shift.scheduled_start_time}-${shift.scheduled_end_time} (shift_id=${shift.id}, current_time=${currentTime})`,
    );

    // ALWAYS auto-detect check_type based on shift status (ignore client's check_type)
    // - If shift has no check_in_time yet → check_in
    // - If shift has check_in_time → check_out (overwrite if exists)
    // - Only reject if shift ended (current time > scheduled_end_time + grace period)
    let checkType: 'check_in' | 'check_out';
    if (!shift.check_in_time) {
      checkType = 'check_in';
      this.logger.log('✅ Auto-detected: CHECK-IN (shift has no check-in yet)');
    } else {
      // Already has check-in → always CHECK-OUT (overwrite if needed)
      checkType = 'check_out';
      
      // Check if shift has ended (current time > scheduled_end_time + 2 hours grace)
      const scheduledEnd = this.parseTimeString(
        shift.scheduled_end_time,
        new Date(),
      );
      const gracePeriodMs = 2 * 60 * 60 * 1000; // 2 hours
      const shiftEndWithGrace = new Date(scheduledEnd.getTime() + gracePeriodMs);
      const now = getVietnamTime();

      if (now > shiftEndWithGrace) {
        // Shift has ended more than 2 hours ago
        this.logger.warn(
          `❌ Shift ${shift.id} has ended (scheduled_end: ${shift.scheduled_end_time}, current: ${currentTime})`,
        );
        return {
          success: false,
          message: `Your shift has ended (${shift.scheduled_start_time} - ${shift.scheduled_end_time}). Cannot check-out after grace period.`,
        };
      }

      if (shift.check_out_time) {
        this.logger.log(
          `⚠️ Auto-detected: CHECK-OUT (OVERWRITE existing check-out time)`,
        );
      } else {
        this.logger.log(
          '✅ Auto-detected: CHECK-OUT (shift already has check-in)',
        );
      }
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

      if (faceResult.face_verified) {
        if (command.check_type === 'check_in') {
          await this.updateEmployeeShiftUseCase.executeCheckIn({
            shift_id: shift.id,
            check_in_time: getVietnamTime(), // ✅ Vietnam timezone (UTC+7)
            check_record_id: attendanceCheck.id,
          });
        } else {
          await this.updateEmployeeShiftUseCase.executeCheckOut({
            shift_id: shift.id,
            check_out_time: getVietnamTime(), // ✅ Vietnam timezone (UTC+7)
            check_record_id: attendanceCheck.id,
          });
        }
      }

      const statusMsg = faceResult.face_verified
        ? `Face: ✅ (${(faceResult.face_confidence * 100).toFixed(1)}%)`
        : `Face: ❌`;

      return {
        success: faceResult.face_verified,
        attendance_check_id: attendanceCheck.id,
        shift_id: shift.id,
        message:
          `${command.check_type === 'check_in' ? 'Check-in' : 'Check-out'} ${faceResult.face_verified ? 'successful' : 'failed'}. ` +
          `Beacon: ✅ | GPS: ${gpsValidated ? '✅' : '⏭️'} | ${statusMsg}`,
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
