import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { UpdateHolidayDto } from '../dto/holiday.dto';
import { HolidayResponseDto } from '../dto/holiday-response.dto';
import { HolidayMapper } from '../mappers/holiday.mapper';

@Injectable()
export class UpdateHolidayUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(id: number, dto: UpdateHolidayDto): Promise<HolidayResponseDto> {
    const existing = await this.holidayRepository.findById(id);

    if (!existing) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Holiday not found',
        404,
        `Holiday with id ${id} not found`,
      );
    }

    // Convert date string to Date if provided
    const updateData = { ...dto };
    if (dto.holiday_date) {
      updateData.holiday_date = new Date(dto.holiday_date) as any;
    }

    const updatedEntity = await this.holidayRepository.update(id, updateData);

    return HolidayMapper.toResponseDto(updatedEntity);
  }
}

