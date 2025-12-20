import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import {
  Permissions,
  CurrentUser,
  JwtPayload,
} from '@graduate-project/shared-common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ValidateBeaconUseCase,
  ValidateBeaconCommand,
} from '../../application/attendance-check/validate-beacon.use-case';
import {
  RequestFaceVerificationUseCase,
  RequestFaceVerificationCommand,
} from '../../application/attendance-check/request-face-verification.use-case';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';
import { ValidateGpsUseCase } from '../../application/attendance-check/validate-gps.use-case';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';

class ValidateBeaconDto {
  @ApiProperty({
    example: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
    description: 'Beacon UUID',
  })
  @IsString()
  @IsNotEmpty()
  beacon_uuid: string;

  @ApiProperty({ example: 1, description: 'Beacon major number' })
  @IsNumber()
  @IsNotEmpty()
  beacon_major: number;

  @ApiProperty({ example: 100, description: 'Beacon minor number' })
  @IsNumber()
  @IsNotEmpty()
  beacon_minor: number;

  @ApiProperty({ example: -65, description: 'Signal strength (RSSI in dBm)' })
  @IsNumber()
  @IsNotEmpty()
  rssi: number;
}

class RequestFaceVerificationDto {
  @ApiProperty({
    example: 'beacon_sess_123_5_1732252800000',
    description: 'Session token from beacon validation',
  })
  @IsString()
  @IsNotEmpty()
  session_token: string;

  @ApiProperty({
    example: 'check_in',
    enum: ['check_in', 'check_out'],
    description: 'Check type',
  })
  @IsEnum(['check_in', 'check_out'])
  @IsNotEmpty()
  check_type: 'check_in' | 'check_out';

  @ApiProperty({
    example: '2025-11-22',
    description: 'Shift date (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  shift_date: Date;

  @ApiProperty({
    example: 10.762622,
    description: 'GPS latitude (REQUIRED for check-in/checkout)',
  })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    example: 106.660172,
    description: 'GPS longitude (REQUIRED for check-in/checkout)',
  })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 15, description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  location_accuracy?: number;

  @ApiPropertyOptional({
    example: 'android-device-abc123',
    description: 'Device identifier',
  })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiPropertyOptional({
    example: '192.168.1.100',
    description: 'Client IP address',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({
    example: 'base64_encoded_face_embedding_binary...',
    description:
      'Face embedding as Base64 string (512 float32 = 2048 bytes). If provided, Face Service will verify; if omitted, auto-approved for testing.',
  })
  @IsOptional()
  @IsString()
  face_embedding_base64?: string;
}

/**
 * 🆕 DTO for GPS webhook verification
 * Called by mobile app when receiving GPS_CHECK_REQUEST push notification
 */
class VerifyGpsWebhookDto {
  @ApiProperty({
    example: 10.762622,
    description: 'GPS latitude from mobile device',
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    example: 106.660172,
    description: 'GPS longitude from mobile device',
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({ example: 15, description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  location_accuracy?: number;
}

@ApiTags('Attendance Check')
@ApiBearerAuth()
@Controller('attendance-check')
export class AttendanceCheckController {
  private readonly logger = new Logger(AttendanceCheckController.name);

  constructor(
    private readonly validateBeaconUseCase: ValidateBeaconUseCase,
    private readonly requestFaceVerificationUseCase: RequestFaceVerificationUseCase,
    private readonly employeeServiceClient: EmployeeServiceClient,
    private readonly validateGpsUseCase: ValidateGpsUseCase,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  @Post('validate-beacon')
  @Permissions('attendance.checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate beacon proximity (Mobile App)' })
  @ApiResponse({ status: 200, description: 'Beacon validation result' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async validateBeacon(
    @Body() dto: ValidateBeaconDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Extract employee_id from JWT token
    const employeeId = user.employee_id;
    if (!employeeId) {
      throw new UnauthorizedException('Employee ID not found in JWT token');
    }

    // Fetch employee info from Employee Service
    const employee =
      await this.employeeServiceClient.getEmployeeById(employeeId);
    if (!employee) {
      throw new UnauthorizedException(`Employee not found: ${employeeId}`);
    }

    const command: ValidateBeaconCommand = {
      employee_id: employee.id,
      employee_code: employee.employee_code,
      beacon_uuid: dto.beacon_uuid,
      beacon_major: dto.beacon_major,
      beacon_minor: dto.beacon_minor,
      rssi: dto.rssi,
    };

    return this.validateBeaconUseCase.execute(command);
  }

  @Post('request-face-verification')
  @Permissions('attendance.checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request face verification for attendance (Mobile App)',
  })
  @ApiResponse({ status: 200, description: 'Face verification requested' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async requestFaceVerification(
    @Body() dto: RequestFaceVerificationDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    // Extract employee_id from JWT token
    const employeeId = user.employee_id;
    
    // 🔍 DEBUG LOG
    this.logger.log(
      `📨 [API] Request face verification - JWT user: ${JSON.stringify(user)}`,
    );
    this.logger.log(`   employee_id from JWT: ${employeeId}`);
    
    if (!employeeId) {
      throw new UnauthorizedException('Employee ID not found in JWT token');
    }

    // Fetch employee info from Employee Service
    const employee =
      await this.employeeServiceClient.getEmployeeById(employeeId);
    if (!employee) {
      throw new UnauthorizedException(`Employee not found: ${employeeId}`);
    }

    this.logger.log(
      `   Employee fetched: id=${employee.id}, code=${employee.employee_code}, dept=${employee.department_id}`,
    );

    const command: RequestFaceVerificationCommand = {
      employee_id: employee.id,
      employee_code: employee.employee_code,
      department_id: employee.department_id || 0,
      session_token: dto.session_token,
      check_type: dto.check_type,
      shift_date: dto.shift_date,
      latitude: dto.latitude,
      longitude: dto.longitude,
      location_accuracy: dto.location_accuracy,
      device_id: dto.device_id,
      ip_address: dto.ip_address || req.ip,
      face_embedding_base64: dto.face_embedding_base64, // 🆕 Forward face embedding
    };

    return this.requestFaceVerificationUseCase.execute(command);
  }

  /**
   * 🆕 GPS Webhook - Called by mobile app when receiving GPS_CHECK_REQUEST push
   * 
   * Flow:
   * 1. Cron gửi silent push → App nhận
   * 2. App lấy GPS hiện tại
   * 3. App gọi endpoint này để verify GPS
   * 4. Server validate GPS + update shift
   * 5. Nếu GPS sai → Server gửi lại notification cảnh báo
   * 
   * Backend tự động:
   * - Extract employee_id từ JWT token
   * - Tìm shift đang active của employee
   * - Validate GPS có trong office radius không
   * - Tăng presence_verification_rounds_completed
   * - Gửi notification nếu GPS outside geofence
   */
  @Post('gps-webhook/verify')
  @Permissions('attendance.checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '📍 Verify GPS location during shift (Background webhook)',
    description:
      'Called by mobile app when receiving GPS_CHECK_REQUEST push notification. ' +
      'Backend will validate GPS location and update shift verification status.',
  })
  @ApiResponse({
    status: 200,
    description: 'GPS verification result',
    schema: {
      type: 'object',
      properties: {
        is_valid: { type: 'boolean' },
        distance_from_office_meters: { type: 'number' },
        message: { type: 'string' },
        shift_id: { type: 'number' },
        verification_round: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'No active shift found for employee',
  })
  async verifyGpsWebhook(
    @Body() dto: VerifyGpsWebhookDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const employeeId = user.employee_id;
    if (!employeeId) {
      throw new UnauthorizedException('Employee ID not found in JWT token');
    }

    this.logger.log(
      `📍 [GPS-WEBHOOK] Received GPS verification from employee ${employeeId}`,
    );
    this.logger.debug(
      `   Location: [${dto.latitude}, ${dto.longitude}], accuracy: ${dto.location_accuracy}m`,
    );

    // 🆕 DÙNG LOGIC GIỐNG CRON JOB - Tìm shift đang diễn ra (checked-in + not checked-out)
    this.logger.debug(
      `📍 [GPS-WEBHOOK] Looking for CURRENT active shift (checked-in + not checked-out) for employee ${employeeId}`,
    );

    const activeShift =
      await this.employeeShiftRepository.findCurrentActiveShiftForGpsCheck(
        employeeId,
      );

    if (!activeShift) {
      this.logger.warn(
        `⚠️ [GPS-WEBHOOK] No active shift found for employee ${employeeId}`,
      );
      this.logger.warn(
        `⚠️ [GPS-WEBHOOK] ℹ️ Possible reasons:`,
      );
      this.logger.warn(
        `   - Employee has not checked in yet (check_in_time IS NULL)`,
      );
      this.logger.warn(
        `   - Employee already checked out (check_out_time IS NOT NULL)`,
      );
      this.logger.warn(
        `   - Current time is outside shift time range`,
      );
      return {
        is_valid: false,
        message: 'No active shift found. GPS check skipped.',
      };
    }

    this.logger.log(
      `📍 [GPS-WEBHOOK] ✅ Found active shift ${activeShift.id} (${activeShift.shift_type})`,
    );
    this.logger.debug(
      `📍 [GPS-WEBHOOK] Shift rounds: ${activeShift.presence_verification_rounds_completed || 0}/${activeShift.presence_verification_rounds_required}`,
    );

    this.logger.log(
      `   Found active shift: ${activeShift.id} (${activeShift.shift_type})`,
    );

    // 2. Get office coordinates từ employee's department
    const employee =
      await this.employeeServiceClient.getEmployeeById(employeeId);
    let officeLatitude = 10.762622; // Default
    let officeLongitude = 106.660172;
    let maxDistanceMeters = 500;

    // Employee service returns department as nested object, not just ID
    const dept = employee as any;
    if (
      dept?.department?.office_latitude &&
      dept?.department?.office_longitude
    ) {
      officeLatitude = Number(dept.department.office_latitude);
      officeLongitude = Number(dept.department.office_longitude);
      if (dept.department.office_radius_meters) {
        maxDistanceMeters = Number(dept.department.office_radius_meters);
      }
    }

    // 3. Validate GPS
    const gpsResult = this.validateGpsUseCase.execute({
      latitude: dto.latitude,
      longitude: dto.longitude,
      location_accuracy: dto.location_accuracy,
      office_latitude: officeLatitude,
      office_longitude: officeLongitude,
      max_distance_meters: maxDistanceMeters,
    });

    this.logger.log(
      `   GPS validation: ${gpsResult.is_valid ? '✅ VALID' : '⚠️ INVALID'}`,
    );
    this.logger.log(
      `   Distance from office: ${gpsResult.distance_from_office_meters}m`,
    );

    // 4. Update shift verification counter
    const currentRound =
      (activeShift.presence_verification_rounds_completed || 0) + 1;
    await this.employeeShiftRepository.update(activeShift.id, {
      presence_verification_rounds_completed: currentRound,
    });

    this.logger.log(
      `   Updated shift verification: round ${currentRound}/${activeShift.presence_verification_rounds_required}`,
    );

    // 5. Nếu GPS invalid → Gửi notification cảnh báo
    if (!gpsResult.is_valid) {
      this.logger.warn(
        `   ⚠️ GPS outside geofence! Distance: ${Math.round(gpsResult.distance_from_office_meters)}m (max: ${maxDistanceMeters}m)`,
      );

      // Gửi alert notification (handler: attendance.location_out_of_range)
      this.notificationClient.emit('attendance.location_out_of_range', {
        employeeId: employeeId,
        shiftId: activeShift.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        timestamp: new Date().toISOString(),
        validation: {
          is_valid: false,
          distance_from_office_meters: gpsResult.distance_from_office_meters,
          max_distance_meters: maxDistanceMeters,
        },
      });
    }

    return {
      is_valid: gpsResult.is_valid,
      distance_from_office_meters: gpsResult.distance_from_office_meters,
      message: gpsResult.message,
      shift_id: activeShift.id,
      verification_round: currentRound,
      required_rounds: activeShift.presence_verification_rounds_required,
    };
  }
}
