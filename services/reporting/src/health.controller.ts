import { Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from '@graduate-project/shared-common';
import { MonthlySummaryProcessor } from './infrastructure/cron/monthly-summary.processor';

@Controller()
export class HealthController {
  constructor(
    private readonly monthlySummaryProcessor: MonthlySummaryProcessor,
  ) {}

  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'reporting',
    };
  }

  @Public()
  @Post('admin/generate-monthly-summaries')
  async generateMonthlySummaries(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('backfill') backfill?: string,
  ) {
    if (backfill === 'true') {
      // Backfill ALL historical months from cache
      await this.monthlySummaryProcessor.backfillAllHistoricalMonths();
      return {
        status: 'success',
        message: 'Backfilled all historical months from cache',
      };
    } else if (year && month) {
      // Generate for specific month
      await this.monthlySummaryProcessor['generateMonthlySummaryForMonth'](
        parseInt(year),
        parseInt(month),
      );
      return {
        status: 'success',
        message: `Generated summaries for ${year}-${month}`,
      };
    } else {
      // Generate for current/last month
      await this.monthlySummaryProcessor.generateMonthlySummaries();
      return {
        status: 'success',
        message: 'Generated monthly summaries for current/last month',
      };
    }
  }

  @Public()
  @Get('readiness')
  readiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('liveness')
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
