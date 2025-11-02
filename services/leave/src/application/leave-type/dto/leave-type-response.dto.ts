import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for Leave Type
 */
export class LeaveTypeResponseDto {
  @ApiProperty({ description: 'Leave type ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Leave type code', example: 'ANNUAL' })
  leave_type_code: string;

  @ApiProperty({ description: 'Leave type name', example: 'Annual Leave' })
  leave_type_name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Nghỉ phép năm có lương' })
  description?: string;

  @ApiProperty({ description: 'Is paid leave', example: true })
  is_paid: boolean;

  @ApiProperty({ description: 'Requires approval', example: true })
  requires_approval: boolean;

  @ApiProperty({ description: 'Requires document', example: false })
  requires_document: boolean;

  @ApiProperty({ description: 'Deducts from balance', example: true })
  deducts_from_balance: boolean;

  @ApiPropertyOptional({ description: 'Maximum days per year', example: 12 })
  max_days_per_year?: number;

  @ApiPropertyOptional({ description: 'Maximum consecutive days', example: 10 })
  max_consecutive_days?: number;

  @ApiProperty({ description: 'Minimum notice days', example: 3 })
  min_notice_days: number;

  @ApiProperty({ description: 'Exclude holidays', example: true })
  exclude_holidays: boolean;

  @ApiProperty({ description: 'Exclude weekends', example: true })
  exclude_weekends: boolean;

  @ApiProperty({ description: 'Allow carry over', example: true })
  allow_carry_over: boolean;

  @ApiPropertyOptional({ description: 'Maximum carry over days', example: 5 })
  max_carry_over_days?: number;

  @ApiProperty({ description: 'Carry over expiry months', example: 3 })
  carry_over_expiry_months: number;

  @ApiProperty({ description: 'Is prorated', example: true })
  is_prorated: boolean;

  @ApiProperty({ description: 'Proration basis', example: 'MONTHLY' })
  proration_basis: string;

  @ApiProperty({ description: 'Is accrued', example: false })
  is_accrued: boolean;

  @ApiPropertyOptional({ description: 'Accrual rate', example: null })
  accrual_rate?: number;

  @ApiProperty({ description: 'Accrual start month', example: 0 })
  accrual_start_month: number;

  @ApiPropertyOptional({ description: 'Color hex', example: '#3B82F6' })
  color_hex: string;

  @ApiPropertyOptional({ description: 'Icon', example: null })
  icon?: string;

  @ApiProperty({ description: 'Sort order', example: 1 })
  sort_order: number;

  @ApiProperty({ description: 'Status', example: 'ACTIVE' })
  status: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00Z' })
  updated_at: Date;
}

/**
 * Response DTO for Create Leave Type (simplified version)
 */
export class CreateLeaveTypeResponseDto {
  @ApiProperty({ description: 'Leave type ID', example: 5 })
  id: number;

  @ApiProperty({ description: 'Leave type code', example: 'MATERNITY' })
  leave_type_code: string;

  @ApiProperty({ description: 'Leave type name', example: 'Maternity Leave' })
  leave_type_name: string;

  @ApiProperty({ description: 'Status', example: 'ACTIVE' })
  status: string;

  @ApiProperty({ description: 'Created at', example: '2024-12-20T10:00:00Z' })
  created_at: Date;
}

/**
 * Response DTO for Update Leave Type (simplified version)
 */
export class UpdateLeaveTypeResponseDto {
  @ApiProperty({ description: 'Leave type ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Leave type code', example: 'ANNUAL' })
  leave_type_code: string;

  @ApiPropertyOptional({ description: 'Maximum days per year', example: 15 })
  max_days_per_year?: number;

  @ApiProperty({ description: 'Updated at', example: '2024-12-20T11:00:00Z' })
  updated_at: Date;
}

// Note: GetLeaveTypesResponseDto is just an alias for array of LeaveTypeResponseDto
// The API response will be wrapped in ApiResponseDto with data as LeaveTypeResponseDto[]

