import { Controller, Post, Req, Logger, Query } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '@graduate-project/shared-common';
import { ScheduledGpsCheckProcessor } from '../../infrastructure/cron/scheduled-gps-check.processor';
import { CheckMissingAttendanceProcessor } from '../../infrastructure/cron/check-missing-attendance.processor';
import { ScheduleVerificationRemindersUseCase } from '../../application/presence-verification/use-cases/schedule-verification-reminders.use-case';

/**
 * ⚠️ INTERNAL TESTING ONLY - DO NOT EXPOSE IN PRODUCTION
 *
 * Controller để test cronjobs manually trên EC2/K8s
 * Thay vì chờ cron chạy theo schedule, có thể trigger ngay lập tức
 *
 * Usage:
 * curl -X POST http://your-service/api/v1/attendance/cron-test/gps-check
 */
@ApiTags('🧪 Cron Test (Internal)')
@ApiBearerAuth()
@Controller('cron-test')
@Public()
export class CronTestController {
  private readonly logger = new Logger(CronTestController.name);
  constructor(
    private readonly gpsCheckProcessor: ScheduledGpsCheckProcessor,
    private readonly missingAttendanceProcessor: CheckMissingAttendanceProcessor,
    private readonly verificationRemindersUseCase: ScheduleVerificationRemindersUseCase,
  ) {}

  @Post('gps-check')
  @ApiOperation({
    summary: '🧪 Test GPS Check Cron (Manual Trigger)',
    description:
      'Manually trigger GPS check for all active shifts. ' +
      'Use useRandomDelay=false for immediate testing (default), or useRandomDelay=true to simulate cron behavior with random delays.',
  })
  @ApiQuery({
    name: 'useRandomDelay',
    required: false,
    type: Boolean,
    description:
      'false = Send GPS requests immediately (for testing). true = Random delay 0-60 minutes (like cron)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'GPS check triggered successfully. Check logs for details.',
  })
  async testGpsCheck(
    @Req() req: Request,
    @Query('useRandomDelay') useRandomDelay?: string,
  ) {
    // Debug: log incoming headers and extracted user (internal troubleshooting only)
    const r = req as Request & { user?: unknown };
    this.logger.debug(
      'Incoming headers: ' + JSON.stringify((r.headers as unknown) || {}),
    );
    this.logger.debug(
      'Extracted user on request: ' + JSON.stringify(r.user ?? null),
    );

    // Convert query param to boolean
    const useRandom = useRandomDelay === 'true';

    const result = await this.gpsCheckProcessor.triggerManually(useRandom);

    return {
      success: true,
      message: useRandom
        ? 'GPS check scheduled with random delays. Check server logs for timing.'
        : 'GPS check requests sent immediately.',
      timestamp: new Date().toISOString(),
      ...result,
    };
  }

  @Post('missing-attendance')
  @ApiOperation({
    summary: '🧪 Test Missing Attendance Check (Manual Trigger)',
    description:
      'Manually trigger missing attendance check. ' +
      "This will find employees who should have checked in but haven't.",
  })
  @ApiResponse({
    status: 200,
    description: 'Missing attendance check triggered successfully.',
  })
  async testMissingAttendance() {
    await this.missingAttendanceProcessor.checkMissingAttendance();
    return {
      success: true,
      message:
        'Missing attendance check triggered. Check server logs for execution details.',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('verification-reminders')
  @ApiOperation({
    summary: '🧪 Test Verification Reminders (Manual Trigger)',
    description:
      'Manually trigger presence verification reminders. ' +
      'This will check active shifts and send reminders for pending verifications.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification reminders triggered successfully.',
  })
  async testVerificationReminders() {
    await this.verificationRemindersUseCase.execute();
    return {
      success: true,
      message:
        'Verification reminders check triggered. Check logs for details.',
      timestamp: new Date().toISOString(),
    };
  }
}
