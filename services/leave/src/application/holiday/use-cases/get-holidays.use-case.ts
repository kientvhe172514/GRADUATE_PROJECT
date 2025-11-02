import { Inject, Injectable } from '@nestjs/common';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HolidayResponseDto } from '../dto/holiday-response.dto';
import { HolidayMapper } from '../mappers/holiday.mapper';

@Injectable()
export class GetHolidaysUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(year?: number, holidayType?: string): Promise<HolidayResponseDto[]> {
    let entities = await this.holidayRepository.findAll();

    // Filter by year if provided
    if (year !== undefined && year !== null) {
      entities = entities.filter((entity) => entity.year === year);
    }

    // Filter by holiday type if provided
    if (holidayType !== undefined && holidayType !== null) {
      entities = entities.filter((entity) => entity.holiday_type === holidayType);
    }

    return HolidayMapper.toResponseDtoList(entities);
  }
}

