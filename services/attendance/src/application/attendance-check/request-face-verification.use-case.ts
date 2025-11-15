import { Injectable, BadRequestException } from '@nestjs/common';
import { AttendanceCheckRepository } from '../../infrastructure/persistence/repositories/attendance-check.repository';
import { ValidateBeaconUseCase } from './validate-beacon.use-case';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

export interface RequestFaceVerificationCommand {
  employee_id: number;
  employee_code: string;
  department_id: number;
  session_token: string;
  check_type: 'check_in' | 'check_out';
  device_id?: string;
  ip_address?: string;
}

export interface FaceVerificationRequestEvent {
  employee_id: number;
  employee_code: string;
  attendance_check_id: number;
  check_type: 'check_in' | 'check_out';
  request_time: Date;
}

@Injectable()
export class RequestFaceVerificationUseCase {
  constructor(
    private readonly attendanceCheckRepository: AttendanceCheckRepository,
    private readonly validateBeaconUseCase: ValidateBeaconUseCase,
    @Inject('FACE_RECOGNITION_SERVICE') private readonly faceRecognitionClient: ClientProxy,
  ) {}

  async execute(command: RequestFaceVerificationCommand): Promise<{
    success: boolean;
    attendance_check_id?: number;
    message: string;
  }> {
    // Validate session token
    const sessionValidation = this.validateBeaconUseCase.validateSession(
      command.session_token,
      command.employee_id,
    );

    if (!sessionValidation.valid) {
      throw new BadRequestException(sessionValidation.error);
    }

    // Create attendance check record with beacon_validated = true
    const attendanceCheck = await this.attendanceCheckRepository.create({
      employee_id: command.employee_id,
      employee_code: command.employee_code,
      department_id: command.department_id,
      check_type: command.check_type,
      beacon_validated: true,
      beacon_id: sessionValidation.beaconId!,
      device_id: command.device_id,
      ip_address: command.ip_address,
    });

    // Publish event to Face Recognition Service
    const event: FaceVerificationRequestEvent = {
      employee_id: command.employee_id,
      employee_code: command.employee_code,
      attendance_check_id: attendanceCheck.id,
      check_type: command.check_type,
      request_time: new Date(),
    };

    this.faceRecognitionClient.emit('face_verification_requested', event);

    return {
      success: true,
      attendance_check_id: attendanceCheck.id,
      message: 'Beacon validated. Please verify your face within the next 2 minutes.',
    };
  }
}
