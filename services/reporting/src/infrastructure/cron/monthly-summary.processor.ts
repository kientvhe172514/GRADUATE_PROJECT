import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

/**
 * Monthly Summary Processor
 * 
 * Runs daily at 01:00 UTC to generate/update monthly attendance summaries
 * This enables fast report queries by using pre-calculated data
 * 
 * Architecture:
 * 1. Query employee_shifts_cache for completed shifts
 * 2. Calculate aggregates (working days, hours, late, absent, etc.)
 * 3. Store in monthly_summaries table for fast access
 * 4. Report queries use this table instead of calculating on-the-fly
 */
@Injectable()
export class MonthlySummaryProcessor {
  private readonly logger = new Logger(MonthlySummaryProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Run at 01:00 AM Vietnam time (GMT+7) every day to generate summaries for previous complete months
   * and update current month's partial data
   */
  @Cron('0 1 * * *', {
    name: 'monthly-summary-generation',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async generateMonthlySummaries() {
    this.logger.log('🔄 Starting monthly summary generation...');
    const startTime = Date.now();

    try {
      // Get current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // We'll generate summaries for:
      // 1. Last month (if we're past 1st of month)
      // 2. Current month (partial data)
      const months = this.getMonthsToGenerate(now);

      for (const { year, month } of months) {
        await this.generateMonthlySummaryForMonth(year, month);
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Monthly summary generation completed in ${duration}ms`,
      );
    } catch (error) {
      this.logger.error('❌ Failed to generate monthly summaries:', error);
      throw error;
    }
  }

  /**
   * Determine which months need summary generation
   * Returns current month + last month by default
   * For backfill, call generateMonthlySummaryForMonth directly with specific year/month
   */
  private getMonthsToGenerate(
    now: Date,
  ): Array<{ year: number; month: number }> {
    const months: Array<{ year: number; month: number }> = [];

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Always include current month (partial data)
    months.push({ year: currentYear, month: currentMonth });

    // Include last month if we're past the 1st
    if (now.getDate() > 1) {
      let lastMonth = currentMonth - 1;
      let lastYear = currentYear;
      if (lastMonth === 0) {
        lastMonth = 12;
        lastYear = currentYear - 1;
      }
      months.push({ year: lastYear, month: lastMonth });
    }

    return months;
  }

  /**
   * Backfill all historical months that have data in employee_shifts_cache
   * This should be called once after initial deployment or when adding historical data
   */
  async backfillAllHistoricalMonths(): Promise<void> {
    this.logger.log('🔄 Starting backfill of all historical months...');

    try {
      // Get all distinct year-month combinations from cache
      const monthsQuery = `
        SELECT DISTINCT 
          EXTRACT(YEAR FROM shift_date)::int as year,
          EXTRACT(MONTH FROM shift_date)::int as month
        FROM employee_shifts_cache
        ORDER BY year DESC, month DESC
      `;

      const monthsWithData = await this.dataSource.query(monthsQuery);

      this.logger.log(
        `📅 Found ${monthsWithData.length} months with data in cache`,
      );

      for (const { year, month } of monthsWithData) {
        await this.generateMonthlySummaryForMonth(year, month);
      }

      this.logger.log(
        `✅ Backfill completed for ${monthsWithData.length} months`,
      );
    } catch (error) {
      this.logger.error('❌ Failed to backfill historical months:', error);
      throw error;
    }
  }

  /**
   * Generate summary for a specific month
   */
  private async generateMonthlySummaryForMonth(
    year: number,
    month: number,
  ): Promise<void> {
    this.logger.log(
      `📅 Generating monthly summary for ${year}-${String(month).padStart(2, '0')}`,
    );

    const query = `
      WITH month_shifts AS (
        -- Get all shifts for the month
        SELECT
          esc.employee_id,
          ec.employee_code,
          ec.full_name,
          ec.department_id,
          ec.department_name,
          esc.shift_date,
          esc.shift_type,
          esc.status,
          esc.work_hours,
          esc.overtime_hours,
          esc.late_minutes,
          esc.early_leave_minutes
        FROM employee_shifts_cache esc
        LEFT JOIN employees_cache ec ON ec.employee_id = esc.employee_id
        WHERE 
          EXTRACT(YEAR FROM esc.shift_date) = $1
          AND EXTRACT(MONTH FROM esc.shift_date) = $2
      ),
      employee_stats AS (
        -- Calculate statistics per employee for the month
        SELECT
          ms.employee_id,
          COALESCE(ms.employee_code, 'UNKNOWN') as employee_code,
          COALESCE(ms.full_name, 'Unknown Employee') as full_name,
          COALESCE(ms.department_id, 0) as department_id,
          COALESCE(ms.department_name, 'Unknown Department') as department_name,
          $1::int as year,
          $2::int as month,
          20::int as total_work_days, -- Standard working days per month
          -- Working days (REGULAR shifts with COMPLETED status)
          COUNT(DISTINCT CASE 
            WHEN ms.shift_type = 'REGULAR' AND ms.status = 'COMPLETED' 
            THEN ms.shift_date 
          END)::int as actual_work_days,
          -- Absent days (no shift recorded)
          COUNT(CASE WHEN ms.status = 'ABSENT' THEN 1 END)::int as absent_days,
          -- Absent count (number of absent instances)
          COUNT(CASE WHEN ms.status = 'ABSENT' THEN 1 END)::int as absent_count,
          0::int as holiday_days, -- Will be updated based on holiday calendar
          -- Total working hours
          COALESCE(SUM(CASE WHEN ms.shift_type = 'REGULAR' THEN ms.work_hours ELSE 0 END), 0)::numeric(8,2) as total_work_hours,
          -- Overtime hours
          COALESCE(SUM(ms.overtime_hours), 0)::numeric(8,2) as total_overtime_hours,
          -- Total leave hours (calculated from leave events later)
          0::numeric(8,2) as total_leave_hours,
          -- Late arrivals
          COUNT(CASE WHEN ms.late_minutes > 0 THEN 1 END)::int as late_count,
          -- Early leaves
          COUNT(CASE WHEN ms.early_leave_minutes > 0 THEN 1 END)::int as early_leave_count,
          -- Total late minutes
          COALESCE(SUM(CASE WHEN ms.late_minutes > 0 THEN ms.late_minutes ELSE 0 END), 0)::int as total_late_minutes
        FROM month_shifts ms
        GROUP BY ms.employee_id, ms.employee_code, ms.full_name, ms.department_id, ms.department_name
      )
      INSERT INTO monthly_summaries (
        employee_id, employee_code, employee_name, department_id, department_name,
        year, month, total_work_days, actual_work_days, absent_days, leave_days, 
        holiday_days, total_work_hours, total_overtime_hours, total_leave_hours,
        late_count, early_leave_count, absent_count, total_late_minutes, 
        attendance_rate, punctuality_rate, generated_at
      )
      SELECT
        es.employee_id,
        es.employee_code,
        es.full_name as employee_name,
        es.department_id,
        es.department_name,
        es.year,
        es.month,
        es.total_work_days,
        es.actual_work_days,
        es.absent_days,
        0 as leave_days, -- Will be updated from leave service
        es.holiday_days,
        es.total_work_hours,
        es.total_overtime_hours,
        es.total_leave_hours,
        es.late_count,
        es.early_leave_count,
        es.absent_count,
        es.total_late_minutes,
        -- Attendance rate = actual_work_days / total_work_days * 100
        CASE 
          WHEN es.total_work_days > 0 
          THEN ROUND((es.actual_work_days::numeric / es.total_work_days) * 100, 2)
          ELSE 0
        END as attendance_rate,
        -- Punctuality rate = (actual_work_days - late_count) / actual_work_days * 100
        CASE 
          WHEN es.actual_work_days > 0
          THEN ROUND(((es.actual_work_days - es.late_count)::numeric / es.actual_work_days) * 100, 2)
          ELSE 100
        END as punctuality_rate,
        NOW() as generated_at
      FROM employee_stats es
      ON CONFLICT (employee_id, year, month) DO UPDATE SET
        employee_code = EXCLUDED.employee_code,
        employee_name = EXCLUDED.employee_name,
        department_id = EXCLUDED.department_id,
        department_name = EXCLUDED.department_name,
        total_work_days = EXCLUDED.total_work_days,
        actual_work_days = EXCLUDED.actual_work_days,
        absent_days = EXCLUDED.absent_days,
        holiday_days = EXCLUDED.holiday_days,
        total_work_hours = EXCLUDED.total_work_hours,
        total_overtime_hours = EXCLUDED.total_overtime_hours,
        total_leave_hours = EXCLUDED.total_leave_hours,
        late_count = EXCLUDED.late_count,
        early_leave_count = EXCLUDED.early_leave_count,
        absent_count = EXCLUDED.absent_count,
        total_late_minutes = EXCLUDED.total_late_minutes,
        attendance_rate = EXCLUDED.attendance_rate,
        punctuality_rate = EXCLUDED.punctuality_rate,
        generated_at = EXCLUDED.generated_at
    `;

    const result = await this.dataSource.query(query, [year, month]);
    this.logger.log(
      `✅ Generated summaries for ${year}-${String(month).padStart(2, '0')}`,
    );
  }
}
