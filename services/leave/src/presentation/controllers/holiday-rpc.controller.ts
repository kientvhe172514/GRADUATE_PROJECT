import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetHolidaysUseCase } from '../../application/holiday/use-cases/get-holidays.use-case';
import { GetHolidaysByYearUseCase } from '../../application/holiday/use-cases/get-holidays-by-year.use-case';

/**
 * RPC Controller for Holiday service
 * Handles RPC requests from other microservices (e.g., Attendance service)
 */
@Controller()
export class HolidayRpcController {
  private readonly logger = new Logger(HolidayRpcController.name);

  constructor(
    private readonly getHolidaysUseCase: GetHolidaysUseCase,
    private readonly getHolidaysByYearUseCase: GetHolidaysByYearUseCase,
  ) {}

  /**
   * Check if a specific date is a holiday
   * @returns { is_holiday: boolean, holiday_name?: string, holiday_type?: string }
   */
  @MessagePattern('holiday.check_date')
  async checkDate(
    @Payload() payload: { date: string; department_id?: number },
  ): Promise<any> {
    try {
      this.logger.debug(`RPC: holiday.check_date - ${payload.date}`);

      const targetDate = new Date(payload.date);
      const year = targetDate.getFullYear();

      // Get all holidays for that year
      const holidays = await this.getHolidaysByYearUseCase.execute(year);

      // Find holiday for this specific date
      const dateStr = payload.date; // YYYY-MM-DD
      const holiday = holidays.find((h) => {
        const holidayDateStr = new Date(h.holiday_date)
          .toISOString()
          .split('T')[0];
        return holidayDateStr === dateStr && h.status === 'ACTIVE';
      });

      if (!holiday) {
        return {
          status: 'SUCCESS',
          statusCode: 200,
          data: { is_holiday: false },
        };
      }

      // Check if holiday applies to this department
      if (payload.department_id) {
        if (holiday.applies_to === 'DEPARTMENT' && holiday.department_ids) {
          const deptIds = holiday.department_ids
            .split(',')
            .map((id) => parseInt(id.trim()));
          if (!deptIds.includes(payload.department_id)) {
            return {
              status: 'SUCCESS',
              statusCode: 200,
              data: { is_holiday: false },
            };
          }
        }
      }

      return {
        status: 'SUCCESS',
        statusCode: 200,
        data: {
          is_holiday: true,
          holiday_name: holiday.holiday_name,
          holiday_type: holiday.holiday_type,
          holiday_id: holiday.id,
        },
      };
    } catch (error) {
      this.logger.error('RPC holiday.check_date failed', error);
      return {
        status: 'ERROR',
        statusCode: 500,
        message: 'Failed to check holiday',
      };
    }
  }

  /**
   * Get holidays in a date range
   */
  @MessagePattern('holiday.get_in_range')
  async getInRange(
    @Payload()
    payload: {
      start_date: string;
      end_date: string;
      department_id?: number;
    },
  ): Promise<any> {
    try {
      this.logger.debug(
        `RPC: holiday.get_in_range - ${payload.start_date} to ${payload.end_date}`,
      );

      const filters: any = {
        status: 'ACTIVE',
      };

      const holidays = await this.getHolidaysUseCase.execute(filters);

      // Filter by date range
      const startDate = new Date(payload.start_date);
      const endDate = new Date(payload.end_date);

      let filtered = holidays.filter((h) => {
        const holidayDate = new Date(h.holiday_date);
        return holidayDate >= startDate && holidayDate <= endDate;
      });

      // Filter by department if provided
      if (payload.department_id) {
        filtered = filtered.filter((h) => {
          if (h.applies_to === 'ALL') return true;
          if (h.applies_to === 'DEPARTMENT' && h.department_ids) {
            const deptIds = h.department_ids
              .split(',')
              .map((id) => parseInt(id.trim()));
            return deptIds.includes(payload.department_id!);
          }
          return false;
        });
      }

      return {
        status: 'SUCCESS',
        statusCode: 200,
        data: filtered,
      };
    } catch (error) {
      this.logger.error('RPC holiday.get_in_range failed', error);
      return {
        status: 'ERROR',
        statusCode: 500,
        message: 'Failed to get holidays',
      };
    }
  }

  /**
   * Get holidays by year
   */
  @MessagePattern('holiday.get_by_year')
  async getByYear(
    @Payload() payload: { year: number; department_id?: number },
  ): Promise<any> {
    try {
      this.logger.debug(`RPC: holiday.get_by_year - ${payload.year}`);

      let holidays = await this.getHolidaysByYearUseCase.execute(payload.year);

      // Filter by department if provided
      if (payload.department_id) {
        holidays = holidays.filter((h) => {
          if (h.applies_to === 'ALL') return true;
          if (h.applies_to === 'DEPARTMENT' && h.department_ids) {
            const deptIds = h.department_ids
              .split(',')
              .map((id) => parseInt(id.trim()));
            return deptIds.includes(payload.department_id!);
          }
          return false;
        });
      }

      return {
        status: 'SUCCESS',
        statusCode: 200,
        data: holidays,
      };
    } catch (error) {
      this.logger.error('RPC holiday.get_by_year failed', error);
      return {
        status: 'ERROR',
        statusCode: 500,
        message: 'Failed to get holidays',
      };
    }
  }
}
