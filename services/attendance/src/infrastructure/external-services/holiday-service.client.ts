import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export interface HolidayDto {
  id: number;
  holiday_name: string;
  holiday_date: string; // YYYY-MM-DD
  holiday_type: string;
  applies_to: string;
  department_ids?: string;
  location_ids?: string;
  is_paid: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Client to communicate with Leave Service to fetch holidays
 */
@Injectable()
export class HolidayServiceClient {
  private readonly logger = new Logger(HolidayServiceClient.name);

  constructor(
    @Inject('LEAVE_SERVICE') private readonly leaveClient: ClientProxy,
  ) {}

  /**
   * Check if a specific date is a holiday
   * @param date Date to check (YYYY-MM-DD format)
   * @param departmentId Optional department ID to check department-specific holidays
   * @returns true if the date is a holiday, false otherwise
   */
  async isHoliday(date: string, departmentId?: number): Promise<boolean> {
    try {
      this.logger.debug(`🗓️ Checking if ${date} is a holiday (dept: ${departmentId || 'ALL'})`);

      const response: any = await firstValueFrom(
        this.leaveClient.send('holiday.check_date', { date, department_id: departmentId }),
      );

      if (response?.status === 'SUCCESS' && response?.data) {
        const isHoliday = response.data.is_holiday === true;
        if (isHoliday) {
          this.logger.log(`✅ ${date} is a holiday: ${response.data.holiday_name || 'Unknown'}`);
        }
        return isHoliday;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to check holiday for date ${date}`, error);
      // If service is down, assume not a holiday (fail-open)
      return false;
    }
  }

  /**
   * Get all holidays for a date range
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @param departmentId Optional department ID
   * @returns Array of holidays
   */
  async getHolidaysInRange(
    startDate: string,
    endDate: string,
    departmentId?: number,
  ): Promise<HolidayDto[]> {
    try {
      this.logger.debug(
        `🗓️ Fetching holidays from ${startDate} to ${endDate} (dept: ${departmentId || 'ALL'})`,
      );

      const response: any = await firstValueFrom(
        this.leaveClient.send('holiday.get_in_range', {
          start_date: startDate,
          end_date: endDate,
          department_id: departmentId,
        }),
      );

      if (response?.status === 'SUCCESS' && Array.isArray(response?.data)) {
        this.logger.log(`✅ Fetched ${response.data.length} holidays`);
        return response.data;
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch holidays for range ${startDate} - ${endDate}`, error);
      return [];
    }
  }

  /**
   * Get holidays for a specific year
   * @param year Year (e.g., 2025)
   * @param departmentId Optional department ID
   * @returns Array of holidays
   */
  async getHolidaysByYear(year: number, departmentId?: number): Promise<HolidayDto[]> {
    try {
      this.logger.debug(`🗓️ Fetching holidays for year ${year} (dept: ${departmentId || 'ALL'})`);

      const response: any = await firstValueFrom(
        this.leaveClient.send('holiday.get_by_year', {
          year,
          department_id: departmentId,
        }),
      );

      if (response?.status === 'SUCCESS' && Array.isArray(response?.data)) {
        this.logger.log(`✅ Fetched ${response.data.length} holidays for year ${year}`);
        return response.data;
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch holidays for year ${year}`, error);
      return [];
    }
  }
}
