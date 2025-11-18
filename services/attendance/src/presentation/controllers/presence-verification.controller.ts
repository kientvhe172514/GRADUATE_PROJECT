import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'Verification captured successfully' })
  async capture(@Body() data: {
    employeeId: string;
    shiftId: string;
    roundNumber: number;
    imageUrl: string;
    location: { latitude: number; longitude: number };
  }) {
    return this.captureUseCase.execute(data);
  }

  @Get('schedule/:shiftId')

  @ApiOperation({ summary: 'Get verification schedule for a shift' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  async getSchedule(@Param('shiftId') shiftId: string) {
    return this.getScheduleUseCase.execute(shiftId);
  }
}
