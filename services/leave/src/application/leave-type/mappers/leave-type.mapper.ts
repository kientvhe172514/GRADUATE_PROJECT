import { LeaveTypeEntity } from '../../../domain/entities/leave-type.entity';
import { LeaveTypeResponseDto, CreateLeaveTypeResponseDto, UpdateLeaveTypeResponseDto } from '../dto/leave-type-response.dto';

/**
 * Mapper for converting LeaveTypeEntity to DTOs
 */
export class LeaveTypeMapper {
  static toResponseDto(entity: LeaveTypeEntity): LeaveTypeResponseDto {
    return {
      id: entity.id,
      leave_type_code: entity.leave_type_code,
      leave_type_name: entity.leave_type_name,
      description: entity.description,
      is_paid: entity.is_paid,
      requires_approval: entity.requires_approval,
      requires_document: entity.requires_document,
      deducts_from_balance: entity.deducts_from_balance,
      max_days_per_year: entity.max_days_per_year,
      max_consecutive_days: entity.max_consecutive_days,
      min_notice_days: entity.min_notice_days,
      exclude_holidays: entity.exclude_holidays,
      exclude_weekends: entity.exclude_weekends,
      allow_carry_over: entity.allow_carry_over,
      max_carry_over_days: entity.max_carry_over_days,
      carry_over_expiry_months: entity.carry_over_expiry_months,
      is_prorated: entity.is_prorated,
      proration_basis: entity.proration_basis,
      is_accrued: entity.is_accrued,
      accrual_rate: entity.accrual_rate,
      accrual_start_month: entity.accrual_start_month,
      color_hex: entity.color_hex,
      icon: entity.icon,
      sort_order: entity.sort_order,
      status: entity.status,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  static toResponseDtoList(entities: LeaveTypeEntity[]): LeaveTypeResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  static toCreateResponseDto(entity: LeaveTypeEntity): CreateLeaveTypeResponseDto {
    return {
      id: entity.id,
      leave_type_code: entity.leave_type_code,
      leave_type_name: entity.leave_type_name,
      status: entity.status,
      created_at: entity.created_at,
    };
  }

  static toUpdateResponseDto(entity: LeaveTypeEntity): UpdateLeaveTypeResponseDto {
    return {
      id: entity.id,
      leave_type_code: entity.leave_type_code,
      max_days_per_year: entity.max_days_per_year,
      updated_at: entity.updated_at,
    };
  }
}

