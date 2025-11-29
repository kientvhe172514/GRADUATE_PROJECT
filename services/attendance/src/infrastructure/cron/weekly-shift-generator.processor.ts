import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ShiftGeneratorService } from '../../application/services/shift-generator.service';

/**
 * Weekly Cron Job to generate employee shifts for the upcoming week
 *
 * SCHEDULE: Every Sunday at 23:00 (11 PM)
 * PURPOSE: Pre-generate shifts for next week (Monday → Sunday)
 *
 * WHY WEEKLY?
 * - Gives admins time to adjust schedules before the week starts
 * - Employees can see their schedule in advance
 * - Reduces load (only 1 run per week vs daily)
 *
 * SAFETY MECHANISMS:
 * 1. Respects assignment effective_from/effective_to dates
 * 2. Skips shifts that already exist (no duplicates)
 * 3. Only creates shifts for active work_schedules
 * 4. Handles errors gracefully per employee
 *
 * EXAMPLE:
 * - Sunday Dec 1, 2024 at 23:00
 * - Creates shifts for Dec 2-8 (Mon-Sun)
 * - Next run: Sunday Dec 8 at 23:00 → creates Dec 9-15
 */
@Injectable()
export class WeeklyShiftGeneratorProcessor {
  private readonly logger = new Logger(WeeklyShiftGeneratorProcessor.name);

  constructor(private readonly shiftGeneratorService: ShiftGeneratorService) {}

  /**
   * Runs every Sunday at 23:00 Vietnam time
   * Generates shifts for the upcoming week (Monday → Sunday)
   */
  @Cron('0 23 * * 0', {
    name: 'weekly-shift-generator',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async generateWeeklyShifts() {
    const startTime = Date.now();
    this.logger.log('🔄 [CRON] Starting weekly shift generation...');

    try {
      const result =
        await this.shiftGeneratorService.generateShiftsForNextWeek();

      const duration = (Date.now() - startTime) / 1000;

      this.logger.log(
        `✅ [CRON] Weekly shift generation completed in ${duration}s`,
      );
      this.logger.log(
        `📊 [CRON] Stats: ` +
          `Processed=${result.totalProcessed}, ` +
          `Created=${result.shiftsCreated}, ` +
          `Skipped=${result.shiftsSkipped}, ` +
          `Errors=${result.errors.length}`,
      );

      if (result.errors.length > 0) {
        this.logger.warn(
          `⚠️ [CRON] ${result.errors.length} employees had errors:`,
        );
        result.errors.forEach((err) => {
          this.logger.warn(`  - Employee ${err.employeeId}: ${err.error}`);
        });
      }
    } catch (error) {
      this.logger.error(
        '❌ [CRON] Fatal error in weekly shift generation:',
        error,
      );
      // Don't throw - let cron continue on next schedule
    }
  }

  /**
   * Manual trigger for testing
   * Can be called via admin API endpoint
   */
  async triggerManually(): Promise<any> {
    this.logger.log('🔧 [MANUAL] Manually triggered weekly shift generation');
    return await this.shiftGeneratorService.generateShiftsForNextWeek();
  }
}
