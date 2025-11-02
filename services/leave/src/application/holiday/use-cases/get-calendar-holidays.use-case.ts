import { Inject, Injectable } from '@nestjs/common';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { CalendarHolidayResponseDto } from '../dto/holiday-response.dto';
import { HolidayMapper } from '../mappers/holiday.mapper';

@Injectable()
export class GetCalendarHolidaysUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(year: number): Promise<CalendarHolidayResponseDto> {
    const entities = await this.holidayRepository.findByYear(year);

    return HolidayMapper.toCalendarResponseDto(year, entities);
  }
}

