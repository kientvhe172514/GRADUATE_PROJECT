import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { AttendanceCheckRepository } from '../../infrastructure/repositories/attendance-check.repository';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { ValidateBeaconUseCase } from './validate-beacon.use-case';
import { ValidateGpsUseCase } from './validate-gps.use-case';
import { UpdateEmployeeShiftUseCase } from '../employee-shift/update-employee-shift.use-case';
import { GpsCheckCalculatorService } from '../services/gps-check-calculator.service';

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
}

export interface FaceVerificationRequestEvent {
  employee_id: number;
  employee_code: string;
  attendance_check_id: number;
  shift_id: number;
  check_type: 'check_in' | 'check_out';
  request_time: Date;
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
    @Inject('EMPLOYEE_WORK_SCHEDULE_REPOSITORY')
    private readonly employeeWorkScheduleRepository: any,
    @Inject('WORK_SCHEDULE_REPOSITORY')
    private readonly workScheduleRepository: any,
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

    // Step 1: Validate session token (beacon already validated)
    const sessionValidation = this.validateBeaconUseCase.validateSession(
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

    // Step 3: Find employee shift (prioritize OT shift if exists)
    // First, check if there's an OVERTIME shift (approved OT request creates OT shift)
    let shift = await this.employeeShiftRepository.findOTShiftByEmployeeAndDate(
      command.employee_id,
      command.shift_date,
    );

    if (shift) {
      this.logger.log(
        `Found OVERTIME shift for employee ${command.employee_code} on ${command.shift_date.toISOString()} (shift_id=${shift.id})`,
      );
    } else {
      // If no OT shift, try to find regular shift
      shift =
        await this.employeeShiftRepository.findRegularShiftByEmployeeAndDate(
          command.employee_id,
          command.shift_date,
        );

      if (shift) {
        this.logger.log(
          `Found REGULAR shift for employee ${command.employee_code} on ${command.shift_date.toISOString()} (shift_id=${shift.id})`,
        );
      } else {
        // FALLBACK: Try to auto-create shift from assigned work_schedule
        // This handles edge cases where cron didn't run or schedule was just assigned
        this.logger.log(
          `No shift found for employee ${command.employee_code} on ${command.shift_date.toISOString()}. Checking for assigned work schedule...`,
        );

        const assignedSchedule =
          await this.employeeWorkScheduleRepository.findByEmployeeIdAndDate(
            command.employee_id,
            command.shift_date,
          );

        if (!assignedSchedule) {
          // Truly no schedule assigned
          this.logger.warn(
            `Employee ${command.employee_code} has no work schedule assigned for ${command.shift_date.toISOString()}`,
          );
          return {
            success: false,
            message: `You have no work schedule assigned for ${command.shift_date.toISOString().split('T')[0]}. Please contact HR.`,
          };
        }

        // Found assignment → create shift from work_schedule template
        this.logger.log(
          `Found work schedule assignment (ID: ${assignedSchedule.work_schedule_id}). Creating shift...`,
        );

        const workSchedule = await this.workScheduleRepository.findById(
          assignedSchedule.work_schedule_id,
        );

        if (!workSchedule) {
          throw new BadRequestException(
            `Work schedule ${assignedSchedule.work_schedule_id} not found`,
          );
        }

        // Calculate GPS checks
        const gpsChecksRequired =
          await this.gpsCheckCalculator.calculateRequiredChecks(
            'REGULAR',
            workSchedule.start_time || '08:00:00',
            workSchedule.end_time || '17:00:00',
          );

        // Create shift from template
        shift = await this.employeeShiftRepository.create({
          employee_id: command.employee_id,
          employee_code: command.employee_code,
          department_id: command.department_id,
          shift_date: command.shift_date,
          work_schedule_id: workSchedule.id,
          scheduled_start_time: workSchedule.start_time || '08:00',
          scheduled_end_time: workSchedule.end_time || '17:00',
          shift_type: 'REGULAR',
          presence_verification_required: true,
          presence_verification_rounds_required: gpsChecksRequired,
        });

        this.logger.log(
          `✅ Auto-created shift from work schedule template (shift_id=${shift.id})`,
        );
      }
    }

    // Step 4: Create attendance check record (link to shift)
    const attendanceCheck = await this.attendanceCheckRepository.create({
      employee_id: command.employee_id,
      employee_code: command.employee_code,
      department_id: command.department_id,
      shift_id: shift.id, // Link to shift (REGULAR or OVERTIME)
      check_type: command.check_type,
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
      `✅ Attendance check record created: ID=${attendanceCheck.id}, beacon_validated=true, gps_validated=${gpsValidated}`,
    );

    // Step 5: Publish event to Face Recognition Service
    const event: FaceVerificationRequestEvent = {
      employee_id: command.employee_id,
      employee_code: command.employee_code,
      attendance_check_id: attendanceCheck.id,
      shift_id: shift.id,
      check_type: command.check_type,
      request_time: new Date(),
    };

    this.faceRecognitionClient.emit('face_verification_requested', event);

    this.logger.log(
      `📤 Published face_verification_requested event for attendance_check_id=${attendanceCheck.id}`,
    );

    return {
      success: true,
      attendance_check_id: attendanceCheck.id,
      shift_id: shift.id,
      message:
        `${command.check_type === 'check_in' ? 'Check-in' : 'Check-out'} initiated. ` +
        `Beacon: ✅ ${gpsValidated ? '| GPS: ✅' : '| GPS: ⏭️ (skipped)'} | Face: ⏳ (pending verification)`,
    };
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
      const response = await firstValueFrom(
        this.employeeClient
          .send('get_employee_detail', { employee_id: employeeId })
          .pipe(
            timeout(2500), // 2.5s timeout
            catchError((error) => {
              this.logger.debug(
                `Employee Service RPC failed: ${error.message}`,
              );
              return of(null); // Return null on error
            }),
          ),
      );

      if (
        response &&
        response.department &&
        response.department.office_latitude &&
        response.department.office_longitude
      ) {
        office_latitude = Number(response.department.office_latitude);
        office_longitude = Number(response.department.office_longitude);

        // Use department's allowed check-in radius if available
        if (response.department.allowed_check_in_radius_meters) {
          max_distance_meters = Number(
            response.department.allowed_check_in_radius_meters,
          );
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
}
