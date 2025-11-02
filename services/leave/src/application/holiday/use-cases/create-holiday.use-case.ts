import { Inject, Injectable } from '@nestjs/common';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { CreateHolidayDto } from '../dto/holiday.dto';
import { CreateHolidayResponseDto } from '../dto/holiday-response.dto';
import { HolidayMapper } from '../mappers/holiday.mapper';

@Injectable()
export class CreateHolidayUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(dto: CreateHolidayDto): Promise<CreateHolidayResponseDto> {
    // Set default values
    const holidayData = {
      ...dto,
      applies_to: dto.applies_to || 'ALL',
      is_recurring: dto.is_recurring ?? false,
      is_mandatory: dto.is_mandatory ?? true,
      is_paid: dto.is_paid ?? true,
      can_work_for_ot: dto.can_work_for_ot ?? false,
      status: dto.status || 'ACTIVE',
      holiday_date: new Date(dto.holiday_date),
    };

    const createdEntity = await this.holidayRepository.create(holidayData);

    return HolidayMapper.toCreateResponseDto(createdEntity);
  }
}

