import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AttendanceCheckRepository } from '../../infrastructure/persistence/repositories/attendance-check.repository';
import { EmployeeShiftRepository } from '../../infrastructure/persistence/repositories/employee-shift.repository';
import { ValidateBeaconUseCase } from './validate-beacon.use-case';
import { ValidateGpsUseCase } from './validate-gps.use-case';
import { UpdateEmployeeShiftUseCase } from '../employee-shift/update-employee-shift.use-case';

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
  private readonly OFFICE_LATITUDE: number;
  private readonly OFFICE_LONGITUDE: number;
  private readonly MAX_DISTANCE_METERS: number;

  constructor(
    private readonly attendanceCheckRepository: AttendanceCheckRepository,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    private readonly validateBeaconUseCase: ValidateBeaconUseCase,
    private readonly validateGpsUseCase: ValidateGpsUseCase,
    private readonly updateEmployeeShiftUseCase: UpdateEmployeeShiftUseCase,
    private readonly configService: ConfigService,
    @Inject('FACE_RECOGNITION_SERVICE') private readonly faceRecognitionClient: ClientProxy,
  ) {
    // Load office GPS coordinates from config
    this.OFFICE_LATITUDE = this.configService.get<number>('OFFICE_LATITUDE') || 10.762622;
    this.OFFICE_LONGITUDE = this.configService.get<number>('OFFICE_LONGITUDE') || 106.660172;
    this.MAX_DISTANCE_METERS = this.configService.get<number>('MAX_OFFICE_DISTANCE_METERS') || 500;
  }

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

    // Step 2: Validate GPS (if provided)
    let gpsValidated = false;
    let distanceFromOffice: number | undefined;

    if (command.latitude && command.longitude) {
      const gpsResult = this.validateGpsUseCase.execute({
        latitude: command.latitude,
        longitude: command.longitude,
        location_accuracy: command.location_accuracy,
        office_latitude: this.OFFICE_LATITUDE,
        office_longitude: this.OFFICE_LONGITUDE,
        max_distance_meters: this.MAX_DISTANCE_METERS,
      });

      gpsValidated = gpsResult.is_valid;
      distanceFromOffice = gpsResult.distance_from_office_meters;

      if (!gpsValidated) {
        this.logger.warn(
          `GPS validation failed for employee ${command.employee_code}: ${gpsResult.message}`,
        );
      }
    }

    // Step 3: Find or create employee shift
    let shift = await this.employeeShiftRepository.findByEmployeeAndDate(
      command.employee_id,
      command.shift_date,
    );

    if (!shift) {
      // Auto-create shift if not exists (default 8:00-17:00)
      this.logger.log(
        `No shift found for employee ${command.employee_code} on ${command.shift_date}. Creating default shift.`,
      );
      shift = await this.employeeShiftRepository.create({
        employee_id: command.employee_id,
        employee_code: command.employee_code,
        department_id: command.department_id,
        shift_date: command.shift_date,
        scheduled_start_time: '08:00',
        scheduled_end_time: '17:00',
        presence_verification_required: true,
        presence_verification_rounds_required: 3,
      });
    }

    // Step 4: Create attendance check record
    const attendanceCheck = await this.attendanceCheckRepository.create({
      employee_id: command.employee_id,
      employee_code: command.employee_code,
      department_id: command.department_id,
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
      message: `${command.check_type === 'check_in' ? 'Check-in' : 'Check-out'} initiated. ` +
        `Beacon: ✅ ${gpsValidated ? '| GPS: ✅' : '| GPS: ⏭️ (skipped)'} | Face: ⏳ (pending verification)`,
    };
  }
}
