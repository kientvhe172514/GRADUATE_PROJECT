import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '@graduate-project/shared-common';
import { ValidateEmployeeLocationUseCase } from '../../application/attendance-check/validate-employee-location.use-case';

class GpsCheckDto {
  employeeId: string;
  shiftId: string;
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
@Controller('attendance')
@Public()
export class GpsController {
  private readonly logger = new Logger(GpsController.name);

  constructor(
    private readonly validateEmployeeLocationUseCase: ValidateEmployeeLocationUseCase,
  ) {}

  @Post('gps-check')
  @ApiOperation({
    summary: 'Client webhook: submit GPS for geofence validation',
    description:
      'Client sends GPS coordinates to validate against office geofence. Server validates, persists, and publishes events.',
  })
  @ApiBody({ type: GpsCheckDto })
  @ApiResponse({
    status: 200,
    description: 'GPS validation result with distance and validity',
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async gpsCheck(@Body() dto: GpsCheckDto) {
    this.logger.log(
      `GPS check request from employee ${dto.employeeId} for shift ${dto.shiftId}`,
    );

    const result = await this.validateEmployeeLocationUseCase.execute({
      employeeId: dto.employeeId,
      shiftId: dto.shiftId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      location_accuracy: dto.location_accuracy,
    });

    return result;
  }
}
