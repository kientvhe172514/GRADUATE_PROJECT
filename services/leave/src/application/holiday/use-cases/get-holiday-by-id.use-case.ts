import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HolidayResponseDto } from '../dto/holiday-response.dto';
import { HolidayMapper } from '../mappers/holiday.mapper';

@Injectable()
export class GetHolidayByIdUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(id: number): Promise<HolidayResponseDto> {
    const entity = await this.holidayRepository.findById(id);

    if (!entity) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Holiday not found',
        404,
        `Holiday with id ${id} not found`,
      );
    }

    return HolidayMapper.toResponseDto(entity);
  }
}

