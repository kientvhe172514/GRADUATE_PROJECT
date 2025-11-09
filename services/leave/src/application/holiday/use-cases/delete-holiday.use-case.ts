import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../tokens';

@Injectable()
export class DeleteHolidayUseCase {
  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const existing = await this.holidayRepository.findById(id);
    if (!existing) {
      throw new BusinessException(
        ErrorCodes.HOLIDAY_NOT_FOUND,
        'Holiday not found',
        404,
      );
    }

    await this.holidayRepository.delete(id);
  }
}

