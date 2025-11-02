import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';

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
        ErrorCodes.NOT_FOUND,
        'Holiday not found',
        404,
        `Holiday with id ${id} not found`,
      );
    }

    await this.holidayRepository.delete(id);
  }
}

