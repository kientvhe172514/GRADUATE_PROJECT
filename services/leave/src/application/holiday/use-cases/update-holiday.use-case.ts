import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { UpdateHolidayDto, HolidayResponseDto } from '../dto/holiday.dto';

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
        ErrorCodes.HOLIDAY_NOT_FOUND,
        'Holiday not found',
        404,
      );
    }

    const updateData: any = { ...dto };
    
    // Convert date string to Date object if provided
    if (dto.holiday_date) {
      updateData.holiday_date = new Date(dto.holiday_date);
    }

    const result = await this.holidayRepository.update(id, updateData);
    return result as HolidayResponseDto;
  }
}

