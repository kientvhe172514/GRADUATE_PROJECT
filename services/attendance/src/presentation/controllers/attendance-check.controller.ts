import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Permissions } from '@graduate-project/shared-common';
import {
  ValidateBeaconUseCase,
  ValidateBeaconCommand,
} from '../../application/attendance-check/validate-beacon.use-case';
import {
  RequestFaceVerificationUseCase,
  RequestFaceVerificationCommand,
} from '../../application/attendance-check/request-face-verification.use-case';

class ValidateBeaconDto {
  @ApiProperty({ example: 123, description: 'Employee ID (from JWT token)' })
  employee_id: number;

  @ApiProperty({ example: 'EMP001', description: 'Employee code (from JWT token)' })
  employee_code: string;

  @ApiProperty({ example: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', description: 'Beacon UUID' })
  beacon_uuid: string;

  @ApiProperty({ example: 1, description: 'Beacon major number' })
  beacon_major: number;

  @ApiProperty({ example: 100, description: 'Beacon minor number' })
  beacon_minor: number;

  @ApiProperty({ example: -65, description: 'Signal strength (RSSI in dBm)' })
  rssi: number;
}

class RequestFaceVerificationDto {
  @ApiProperty({ example: 123, description: 'Employee ID (from JWT token)' })
  employee_id: number;

  @ApiProperty({ example: 'EMP001', description: 'Employee code (from JWT token)' })
  employee_code: string;

  @ApiProperty({ example: 10, description: 'Department ID (from JWT token)' })
  department_id: number;

  @ApiProperty({ example: 'beacon_sess_123_5_1732252800000', description: 'Session token from beacon validation' })
  session_token: string;

  @ApiProperty({ example: 'check_in', enum: ['check_in', 'check_out'], description: 'Check type' })
  check_type: 'check_in' | 'check_out';

  @ApiProperty({ example: '2025-11-22', description: 'Shift date (YYYY-MM-DD)' })
  shift_date: Date;

  @ApiPropertyOptional({ example: 10.762622, description: 'GPS latitude (optional but recommended)' })
  latitude?: number;

  @ApiPropertyOptional({ example: 106.660172, description: 'GPS longitude (optional but recommended)' })
  longitude?: number;

  @ApiPropertyOptional({ example: 15, description: 'GPS accuracy in meters' })
  location_accuracy?: number;

  @ApiPropertyOptional({ example: 'android-device-abc123', description: 'Device identifier' })
  device_id?: string;

  @ApiPropertyOptional({ example: '192.168.1.100', description: 'Client IP address' })
  ip_address?: string;
}

@ApiTags('Attendance Check')
@ApiBearerAuth()
@Controller('attendance-check')
export class AttendanceCheckController {
  constructor(
    private readonly validateBeaconUseCase: ValidateBeaconUseCase,
    private readonly requestFaceVerificationUseCase: RequestFaceVerificationUseCase,
  ) {}

  @Post('validate-beacon')
  @Permissions('attendance.checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate beacon proximity (Mobile App)' })
  @ApiResponse({ status: 200, description: 'Beacon validation result' })
  async validateBeacon(@Body() dto: ValidateBeaconDto) {
    const command: ValidateBeaconCommand = {
      employee_id: dto.employee_id,
      employee_code: dto.employee_code,
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
  async requestFaceVerification(
    @Body() dto: RequestFaceVerificationDto,
    @Req() req: any,
  ) {
    const command: RequestFaceVerificationCommand = {
      employee_id: dto.employee_id,
      employee_code: dto.employee_code,
      department_id: dto.department_id,
      session_token: dto.session_token,
      check_type: dto.check_type,
      shift_date: dto.shift_date,
      latitude: dto.latitude,
      longitude: dto.longitude,
      location_accuracy: dto.location_accuracy,
      device_id: dto.device_id,
      ip_address: dto.ip_address || req.ip,
    };

    return this.requestFaceVerificationUseCase.execute(command);
  }
}
