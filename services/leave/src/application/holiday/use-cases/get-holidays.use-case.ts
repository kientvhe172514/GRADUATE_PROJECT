import { Inject, Injectable } from '@nestjs/common';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { GetHolidaysQueryDto, HolidayResponseDto } from '../dto/holiday.dto';

@Injectable()
export class GetHolidaysUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(filters?: GetHolidaysQueryDto): Promise<HolidayResponseDto[]> {
    let results;

    if (filters?.year) {
      results = await this.holidayRepository.findByYear(filters.year);
    } else {
      results = await this.holidayRepository.findAll();
    }

    // Apply additional filters if needed
    if (filters?.holiday_type) {
      results = results.filter(h => h.holiday_type === filters.holiday_type);
    }

    if (filters?.status) {
      results = results.filter(h => h.status === filters.status);
    }

    return results as HolidayResponseDto[];
  }
}

