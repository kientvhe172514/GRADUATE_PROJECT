import { Inject, Injectable } from '@nestjs/common';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { HolidayResponseDto } from '../dto/holiday.dto';

@Injectable()
export class GetHolidaysByYearUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(year: number): Promise<HolidayResponseDto[]> {
    const holidays = await this.holidayRepository.findByYear(year);
    return holidays as HolidayResponseDto[];
  }
}

