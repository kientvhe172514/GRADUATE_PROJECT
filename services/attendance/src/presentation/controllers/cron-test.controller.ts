import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@graduate-project/shared-common';
import { ScheduledGpsCheckProcessor } from '../../infrastructure/cron/scheduled-gps-check.processor';
import { CheckMissingAttendanceProcessor } from '../../infrastructure/cron/check-missing-attendance.processor';

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
@Controller('cron-test')
@Public()
export class CronTestController {
  constructor(
    private readonly gpsCheckProcessor: ScheduledGpsCheckProcessor,
    private readonly missingAttendanceProcessor: CheckMissingAttendanceProcessor,
  ) {}

  @Post('gps-check')
  @ApiOperation({
    summary: '🧪 Test GPS Check Cron (Manual Trigger)',
    description:
      'Manually trigger GPS check for all active shifts. ' +
      'This will send GPS check requests to all employees currently in their shifts.',
  })
  @ApiResponse({
    status: 200,
    description: 'GPS check triggered successfully. Check logs for details.',
  })
  async testGpsCheck() {
    await this.gpsCheckProcessor.triggerGpsCheckForActiveShifts();
    return {
      success: true,
      message: 'GPS check triggered. Check server logs for execution details.',
      timestamp: new Date().toISOString(),
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
  testVerificationReminders() {
    // Note: Verification reminders processor is in PresenceVerificationModule
    // This endpoint is disabled until we expose the processor globally or create a dedicated API
    return {
      success: false,
      message:
        'Verification reminders endpoint temporarily disabled. Use PresenceVerificationModule processor directly.',
      timestamp: new Date().toISOString(),
    };
  }
}
