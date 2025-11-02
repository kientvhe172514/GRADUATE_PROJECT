import { Inject, Injectable } from '@nestjs/common';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { BulkCreateHolidaysDto } from '../dto/holiday.dto';
import { BulkCreateHolidaysResponseDto } from '../dto/holiday-response.dto';
import { HolidayMapper } from '../mappers/holiday.mapper';
import { CreateHolidayUseCase } from './create-holiday.use-case';

@Injectable()
export class BulkCreateHolidaysUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
    private readonly createHolidayUseCase: CreateHolidayUseCase,
  ) {}

  async execute(dto: BulkCreateHolidaysDto): Promise<BulkCreateHolidaysResponseDto> {
    const createdHolidays: any[] = [];
    const errors: string[] = [];

    for (const holidayDto of dto.holidays) {
      try {
        const created = await this.createHolidayUseCase.execute(holidayDto);
        createdHolidays.push(created);
      } catch (error: any) {
        errors.push(
          `Failed to create holiday "${holidayDto.holiday_name}" on ${holidayDto.holiday_date}: ${error.message}`,
        );
      }
    }

    return {
      created_count: createdHolidays.length,
      failed_count: errors.length,
      created_holidays: createdHolidays,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

