import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { CreateHolidayDto, HolidayResponseDto } from '../dto/holiday.dto';
import { HolidayEntity } from '../../../domain/entities/holiday.entity';

@Injectable()
export class CreateHolidayUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(dto: CreateHolidayDto): Promise<HolidayResponseDto> {
    // Check unique constraint: (holiday_date, holiday_type) must be unique
    const startDate = new Date(dto.holiday_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dto.holiday_date);
    endDate.setHours(23, 59, 59, 999);

    const existingHolidays = await this.holidayRepository.findByDateRange(startDate, endDate);
    if (existingHolidays && existingHolidays.length > 0) {
      // Check DB unique constraint: (holiday_date, holiday_type)
      const duplicateHoliday = existingHolidays.find(
        h => h.holiday_type === dto.holiday_type
      );
      if (duplicateHoliday) {
        throw new BusinessException(
          ErrorCodes.HOLIDAY_ALREADY_EXISTS,
          `A ${dto.holiday_type} holiday already exists on ${dto.holiday_date}. Only one holiday per type per date is allowed.`,
          400,
        );
      }
    }

    const holiday = new HolidayEntity({
      ...dto,
      holiday_date: new Date(dto.holiday_date),
      status: 'ACTIVE',
    });

    const result = await this.holidayRepository.create(holiday);
    return result as HolidayResponseDto;
  }
}

