import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UnauthorizedException,
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
import {
  ValidateBeaconUseCase,
  ValidateBeaconCommand,
} from '../../application/attendance-check/validate-beacon.use-case';
import {
  RequestFaceVerificationUseCase,
  RequestFaceVerificationCommand,
} from '../../application/attendance-check/request-face-verification.use-case';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';

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

  @ApiPropertyOptional({
    example: 10.762622,
    description: 'GPS latitude (optional but recommended)',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 106.660172,
    description: 'GPS longitude (optional but recommended)',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

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
}

@ApiTags('Attendance Check')
@ApiBearerAuth()
@Controller('attendance-check')
export class AttendanceCheckController {
  constructor(
    private readonly validateBeaconUseCase: ValidateBeaconUseCase,
    private readonly requestFaceVerificationUseCase: RequestFaceVerificationUseCase,
    private readonly employeeServiceClient: EmployeeServiceClient,
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
    if (!employeeId) {
      throw new UnauthorizedException('Employee ID not found in JWT token');
    }

    // Fetch employee info from Employee Service
    const employee =
      await this.employeeServiceClient.getEmployeeById(employeeId);
    if (!employee) {
      throw new UnauthorizedException(`Employee not found: ${employeeId}`);
    }

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
    };

    return this.requestFaceVerificationUseCase.execute(command);
  }
}
