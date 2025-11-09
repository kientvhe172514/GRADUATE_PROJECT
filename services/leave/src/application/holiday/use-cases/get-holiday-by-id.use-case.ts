import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { HolidayResponseDto } from '../dto/holiday.dto';

@Injectable()
export class GetHolidayByIdUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(id: number): Promise<HolidayResponseDto> {
    const holiday = await this.holidayRepository.findById(id);
    if (!holiday) {
      throw new BusinessException(
        ErrorCodes.HOLIDAY_NOT_FOUND,
        'Holiday not found',
        404,
      );
    }

    return holiday as HolidayResponseDto;
  }
}

