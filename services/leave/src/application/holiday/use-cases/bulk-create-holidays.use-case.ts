import { Inject, Injectable } from '@nestjs/common';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { BulkCreateHolidaysDto, HolidayResponseDto } from '../dto/holiday.dto';
import { HolidayEntity } from '../../../domain/entities/holiday.entity';

@Injectable()
export class BulkCreateHolidaysUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(dto: BulkCreateHolidaysDto): Promise<HolidayResponseDto[]> {
    const results: HolidayResponseDto[] = [];

    for (const holidayItem of dto.holidays) {
      // Check if holiday already exists for the same date
      const startDate = new Date(holidayItem.holiday_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(holidayItem.holiday_date);
      endDate.setHours(23, 59, 59, 999);

      const existingHolidays = await this.holidayRepository.findByDateRange(startDate, endDate);
      // Check DB unique constraint: (holiday_date, holiday_type)
      const duplicateExists = existingHolidays?.some(
        h => h.holiday_type === holidayItem.holiday_type
      );

      if (duplicateExists) {
        // Skip duplicates - unique constraint (holiday_date, holiday_type)
        continue;
      }

      const holiday = new HolidayEntity({
        holiday_name: holidayItem.holiday_name,
        holiday_date: new Date(holidayItem.holiday_date),
        holiday_type: holidayItem.holiday_type,
        applies_to: dto.applies_to,
        is_recurring: false,
        is_mandatory: dto.is_mandatory,
        is_paid: dto.is_paid,
        can_work_for_ot: false,
        description: holidayItem.description,
        year: dto.year,
        status: 'ACTIVE',
      });

      const created = await this.holidayRepository.create(holiday);
      results.push(created as HolidayResponseDto);
    }

    return results;
  }
}

