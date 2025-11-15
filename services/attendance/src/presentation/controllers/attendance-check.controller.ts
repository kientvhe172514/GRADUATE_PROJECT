import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ValidateBeaconUseCase, ValidateBeaconCommand } from '../../application/attendance-check/validate-beacon.use-case';
import { RequestFaceVerificationUseCase, RequestFaceVerificationCommand } from '../../application/attendance-check/request-face-verification.use-case';

class ValidateBeaconDto {
  employee_id: number;
  employee_code: string;
  beacon_uuid: string;
  beacon_major: number;
  beacon_minor: number;
  rssi: number;
}

class RequestFaceVerificationDto {
  employee_id: number;
  employee_code: string;
  department_id: number;
  session_token: string;
  check_type: 'check_in' | 'check_out';
  shift_date: Date; // Format: YYYY-MM-DD
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  device_id?: string;
  ip_address?: string;
}

@Controller('attendance-check')
export class AttendanceCheckController {
  constructor(
    private readonly validateBeaconUseCase: ValidateBeaconUseCase,
    private readonly requestFaceVerificationUseCase: RequestFaceVerificationUseCase,
  ) {}

  @Post('validate-beacon')
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
