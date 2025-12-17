import {
  Body,
  Controller,
  Logger,
  Post,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { ValidateEmployeeLocationUseCase } from '../../application/attendance-check/validate-employee-location.use-case';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';

/**
 * GPS Check DTO - Client chỉ cần gửi GPS coordinates
 * Backend sẽ tự:
 * - Extract employee_id từ JWT token
 * - Tìm shift hiện tại của employee
 * - Validate GPS trong phạm vi geofence
 */
class GpsCheckDto {
  latitude: number;
  longitude: number;
  location_accuracy?: number;
}

/**
 * GPS Controller (Presentation Layer)
 *
 * Clean Architecture: Controller only handles HTTP concerns and delegates to Use Cases
 *
 * Responsibilities:
 * - Accept HTTP request
 * - Validate DTO
 * - Call Use Case
 * - Return HTTP response
 *
 * Does NOT know about:
 * - Database
 * - RabbitMQ
 * - Event publishing
 * - Business logic
 */
@ApiTags('Attendance - GPS')
@ApiBearerAuth()
@Controller('gps')
export class GpsController {
  private readonly logger = new Logger(GpsController.name);

  constructor(
    private readonly validateEmployeeLocationUseCase: ValidateEmployeeLocationUseCase,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
  ) {}

  @Post('check')
  @ApiOperation({
    summary: 'Submit GPS coordinates for validation',
    description:
      'Employee app sends current GPS location. Backend automatically:\n' +
      '1. Extract employee_id from JWT token\n' +
      '2. Find active shift for employee\n' +
      '3. Validate GPS within office geofence\n' +
      '4. Update presence verification status\n' +
      '5. Send notification if out of range',
  })
  @ApiBody({
    type: GpsCheckDto,
    examples: {
      valid: {
        summary: 'Valid GPS (within office)',
        value: {
          latitude: 10.762622,
          longitude: 106.660172,
          location_accuracy: 5.0,
        },
      },
      invalid: {
        summary: 'Invalid GPS (outside office)',
        value: {
          latitude: 10.9,
          longitude: 107.0,
          location_accuracy: 10.0,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'GPS validation result',
    schema: {
      example: {
        success: true,
        message: 'GPS validated successfully',
        data: {
          isValid: true,
          distanceFromOffice: 45.2,
          timestamp: '2025-11-27T10:00:00Z',
          shiftId: '123',
          employeeId: '10',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or no active shift found',
    schema: {
      example: {
        success: false,
        message: 'No active shift found for employee',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async gpsCheck(@Body() dto: GpsCheckDto, @CurrentUser() user: JwtPayload) {
    this.logger.log(
      `📍 [GPS-CHECK] Request from employee ${user.employee_id} (${user.email})`,
    );
    this.logger.debug(
      `📍 [GPS-CHECK] Payload: lat=${dto.latitude}, lng=${dto.longitude}, accuracy=${dto.location_accuracy}m`,
    );

    // Auto-find active shift from JWT token
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.logger.debug(
      `📍 [GPS-CHECK] Looking for active shift at ${currentTime} for employee ${user.employee_id}`,
    );

    const activeShift =
      await this.employeeShiftRepository.findActiveShiftByTime(
        Number(user.employee_id),
        now,
        currentTime,
      );

    if (!activeShift) {
      this.logger.warn(
        `📍 [GPS-CHECK] ❌ No active shift found for employee ${user.employee_id} at ${currentTime}`,
      );
      throw new BadRequestException(
        'No active shift found. Please check in first or verify your schedule.',
      );
    }

    this.logger.log(
      `📍 [GPS-CHECK] ✅ Found active shift ${activeShift.id} (${activeShift.shift_type})`,
    );
    this.logger.debug(
      `📍 [GPS-CHECK] Shift rounds: ${activeShift.presence_verification_rounds_completed || 0}/${activeShift.presence_verification_rounds_required}`,
    );

    this.logger.log(
      `📍 [GPS-CHECK] Calling ValidateEmployeeLocationUseCase...`,
    );

    const result = await this.validateEmployeeLocationUseCase.execute({
      employeeId: user.employee_id!.toString(),
      shiftId: activeShift.id.toString(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      location_accuracy: dto.location_accuracy,
    });

    this.logger.log(
      `📍 [GPS-CHECK] Result: ${result.is_valid ? '✅ VALID' : '❌ INVALID'} (distance: ${Math.round(result.distance_from_office_meters)}m)`,
    );

    return result;
  }
}
