import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HeaderBasedPermissionGuard } from '@graduate-project/shared-common';
import { CapturePresenceVerificationUseCase } from '../../application/presence-verification/use-cases/capture-presence-verification.use-case';
import { GetVerificationScheduleUseCase } from '../../application/use-cases/get-verification-schedule.use-case';
import {
  CapturePresenceVerificationDto,
  PresenceVerificationResponseDto,
  VerificationScheduleDto,
} from '../../application/presence-verification/dto/presence-verification.dto';

/**
 * Presence Verification Controller
 * 
 * Handles GPS-based presence verification endpoints
 * 
 * Endpoints:
 * - POST /presence-verification/capture: Capture GPS location for verification round
 * - GET /presence-verification/my-schedule: Get employee's verification schedule
 */
@ApiTags('Presence Verification')
@Controller('presence-verification')
@UseGuards(HeaderBasedPermissionGuard)
@ApiBearerAuth()
export class PresenceVerificationController {
  constructor(
    private readonly capturePresenceVerificationUseCase: CapturePresenceVerificationUseCase,
    private readonly getVerificationScheduleUseCase: GetVerificationScheduleUseCase,
  ) {}

  /**
   * Capture GPS location for presence verification
   * 
   * Business Rules:
   * - Employee must have an active shift (IN_PROGRESS status)
   * - Round number must be 1, 2, or 3
   * - Cannot capture same round twice
   * - Location must be within 1km from office
   * - Location accuracy must be < 100 meters
   * - Anomalies are automatically detected (speed, distance, spoofing)
   */
  @Post('capture')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Capture GPS location for presence verification round' })
  @ApiResponse({
    status: 201,
    description: 'Verification captured successfully',
    type: PresenceVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or business rule violated',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async capturePresenceVerification(
    @Request() req: any,
    @Body() dto: CapturePresenceVerificationDto,
  ): Promise<any> {
    try {
      // TODO: Get shift data from shift repository
      const shiftData = {
        status: 'IN_PROGRESS',
        employee_id: req.user.employee_id || req.user.sub,
        id: dto.shift_id,
      };

      const result = await this.capturePresenceVerificationUseCase.execute(
        dto,
        shiftData,
      );

      return {
        verification_round_id: result.id,
        rounds_completed: dto.round_number,
        rounds_required: 3,
        ...result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to capture presence verification');
    }
  }

  /**
   * Get employee's verification schedule for active shift
   * 
   * Returns:
   * - Active shift information
   * - 3 scheduled verification rounds with times
   * - Completion status for each round
   * - Overdue status (if scheduled time + 30min has passed)
   */
  @Get('my-schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get verification schedule for current employee' })
  @ApiResponse({
    status: 200,
    description: 'Schedule retrieved successfully',
    type: VerificationScheduleDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async getMySchedule(@Request() req: any): Promise<VerificationScheduleDto> {
    const employeeId = Number(req.user.employee_id || req.user.sub);

    const schedule = await this.getVerificationScheduleUseCase.execute(employeeId);

    return schedule;
  }
}
