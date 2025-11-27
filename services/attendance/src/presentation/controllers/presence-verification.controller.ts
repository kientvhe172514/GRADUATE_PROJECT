import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Permissions, Public } from '@graduate-project/shared-common';
import { CapturePresenceVerificationUseCase } from '../../application/presence-verification/use-cases/capture-presence-verification.use-case';
import { GetVerificationScheduleUseCase } from '../../application/presence-verification/use-cases/get-verification-schedule.use-case';

@ApiTags('Presence Verification')
@Public()
@Controller('presence-verification')
@ApiBearerAuth()
export class PresenceVerificationController {
  constructor(
    private readonly captureUseCase: CapturePresenceVerificationUseCase,
    private readonly getScheduleUseCase: GetVerificationScheduleUseCase,
  ) {}

  @Post('capture')
  @ApiOperation({ summary: 'Capture presence verification with GPS location' })
  @ApiResponse({
    status: 201,
    description: 'Verification captured successfully',
  })
  async capture(
    @Body()
    data: {
      employeeId: string;
      shiftId: string;
      roundNumber: number;
      imageUrl: string;
      location: { latitude: number; longitude: number };
    },
  ) {
    return this.captureUseCase.execute(data);
  }

  @Get('schedule/:shiftId')
  @ApiOperation({ summary: 'Get verification schedule for a shift' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  async getSchedule(@Param('shiftId') shiftId: string) {
    return this.getScheduleUseCase.execute(shiftId);
  }

  @Get('records/:shiftId')
  @ApiOperation({
    summary: 'Get all verification records for a shift',
    description:
      'Returns all GPS verification records including location coordinates, ' +
      'timestamps, and verification status for a specific shift',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification records retrieved successfully',
    schema: {
      example: {
        shiftId: 1,
        totalRounds: 3,
        completedRounds: 2,
        records: [
          {
            id: 1,
            roundNumber: 1,
            latitude: 21.0285,
            longitude: 105.8542,
            distanceFromOffice: 45.2,
            locationAccuracy: 5.0,
            validationStatus: 'VALID',
            verifiedAt: '2025-11-28T00:30:00Z',
            status: 'VERIFIED',
          },
          {
            id: 2,
            roundNumber: 2,
            latitude: 21.0286,
            longitude: 105.8543,
            distanceFromOffice: 38.7,
            locationAccuracy: 4.5,
            validationStatus: 'VALID',
            verifiedAt: '2025-11-28T02:30:00Z',
            status: 'VERIFIED',
          },
        ],
      },
    },
  })
  async getRecords(@Param('shiftId') shiftId: string) {
    const records = await this.getScheduleUseCase.execute(shiftId);
    
    return {
      shiftId: Number(shiftId),
      totalRounds: 3, // Default required rounds
      completedRounds: records.length,
      records: records.map((r) => ({
        id: r.id,
        roundNumber: r.round_number, // ✅ FIX: Use snake_case from entity
        latitude: r.latitude,
        longitude: r.longitude,
        distanceFromOffice: r.distance_from_office_meters,
        locationAccuracy: r.location_accuracy,
        validationStatus: r.validation_status,
        verifiedAt: r.captured_at, // ✅ FIX: Use captured_at from entity
        status: r.is_valid ? 'VERIFIED' : 'INVALID',
      })),
    };
  }
}
