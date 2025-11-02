import { HolidayEntity } from '../../../domain/entities/holiday.entity';
import {
  HolidayResponseDto,
  CreateHolidayResponseDto,
  CalendarHolidayResponseDto,
} from '../dto/holiday-response.dto';

/**
 * Mapper for converting HolidayEntity to DTOs
 */
export class HolidayMapper {
  static toResponseDto(entity: HolidayEntity): HolidayResponseDto {
    return {
      id: entity.id,
      holiday_name: entity.holiday_name,
      holiday_date: entity.holiday_date,
      holiday_type: entity.holiday_type,
      applies_to: entity.applies_to,
      department_ids: entity.department_ids,
      location_ids: entity.location_ids,
      is_recurring: entity.is_recurring,
      recurring_month: entity.recurring_month,
      recurring_day: entity.recurring_day,
      recurring_rule: entity.recurring_rule,
      is_mandatory: entity.is_mandatory,
      is_paid: entity.is_paid,
      can_work_for_ot: entity.can_work_for_ot,
      description: entity.description,
      year: entity.year,
      status: entity.status,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toResponseDtoList(entities: HolidayEntity[]): HolidayResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  static toCreateResponseDto(entity: HolidayEntity): CreateHolidayResponseDto {
    return {
      id: entity.id,
      holiday_name: entity.holiday_name,
      holiday_date: entity.holiday_date,
      holiday_type: entity.holiday_type,
      status: entity.status,
      created_at: entity.created_at,
    };
  }

  static toCalendarResponseDto(year: number, entities: HolidayEntity[]): CalendarHolidayResponseDto {
    return {
      year,
      holidays: this.toResponseDtoList(entities),
    };
  }
}

