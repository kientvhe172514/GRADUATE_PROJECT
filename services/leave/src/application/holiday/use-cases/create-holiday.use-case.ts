import { Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ClientProxy } from '@nestjs/microservices';
import { IHolidayRepository } from '../../ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../tokens';
import { CreateHolidayDto, HolidayResponseDto } from '../dto/holiday.dto';
import { HolidayEntity } from '../../../domain/entities/holiday.entity';

@Injectable()
export class CreateHolidayUseCase {
  private readonly logger = new Logger(CreateHolidayUseCase.name);

  constructor(
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepository: IHolidayRepository,
    @Inject('ATTENDANCE_SERVICE') private readonly attendanceClient: ClientProxy,
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

    // Publish event to notify other services (e.g., Attendance service)
    try {
      this.logger.log(`Publishing holiday.created event for holiday ${result.id}`);
      this.attendanceClient.emit('holiday.created', {
        id: result.id,
        holiday_name: result.holiday_name,
        holiday_date: result.holiday_date.toISOString().split('T')[0],
        holiday_type: result.holiday_type,
        applies_to: result.applies_to,
        department_ids: result.department_ids,
        location_ids: result.location_ids,
        is_paid: result.is_paid,
        status: result.status,
      });
    } catch (error) {
      this.logger.error('Failed to publish holiday.created event', error);
      // Don't fail the request if event publishing fails
    }

    return result as HolidayResponseDto;
  }
}

