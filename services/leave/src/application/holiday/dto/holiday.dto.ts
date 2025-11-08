import { IsString, IsDateString, IsEnum, IsBoolean, IsOptional, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum HolidayType {
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
  COMPANY_HOLIDAY = 'COMPANY_HOLIDAY',
  REGIONAL_HOLIDAY = 'REGIONAL_HOLIDAY',
  RELIGIOUS_HOLIDAY = 'RELIGIOUS_HOLIDAY',
}

export enum HolidayAppliesTo {
  ALL = 'ALL',
  DEPARTMENT = 'DEPARTMENT',
  LOCATION = 'LOCATION',
}

export enum HolidayStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateHolidayDto {
  @ApiProperty({ example: 'Lunar New Year' })
  @IsString()
  holiday_name: string;

  @ApiProperty({ example: '2025-01-29' })
  @IsDateString()
  holiday_date: string;

  @ApiProperty({ enum: HolidayType, example: HolidayType.PUBLIC_HOLIDAY })
  @IsEnum(HolidayType)
  holiday_type: HolidayType;

  @ApiProperty({ enum: HolidayAppliesTo, example: HolidayAppliesTo.ALL })
  @IsEnum(HolidayAppliesTo)
  applies_to: HolidayAppliesTo;

  @ApiProperty({ required: false, example: '1,2,3', description: 'Comma-separated department IDs' })
  @IsOptional()
  @IsString()
  department_ids?: string;

  @ApiProperty({ required: false, example: '1,2', description: 'Comma-separated location IDs' })
  @IsOptional()
  @IsString()
  location_ids?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_recurring: boolean;

  @ApiProperty({ required: false, example: 1, description: 'Month (1-12) for recurring holiday' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  recurring_month?: number;

  @ApiProperty({ required: false, example: 1, description: 'Day (1-31) for recurring holiday' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  recurring_day?: number;

  @ApiProperty({ required: false, description: 'Custom recurring rule (e.g., lunar calendar)' })
  @IsOptional()
  @IsString()
  recurring_rule?: string;

  @ApiProperty({ example: true, description: 'Whether attendance is mandatory' })
  @IsBoolean()
  is_mandatory: boolean;

  @ApiProperty({ example: true, description: 'Whether the day is paid' })
  @IsBoolean()
  is_paid: boolean;

  @ApiProperty({ example: false, description: 'Can work for overtime compensation' })
  @IsBoolean()
  can_work_for_ot: boolean;

  @ApiProperty({ required: false, example: 'National holiday celebrating Lunar New Year' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2025 })
  @IsInt()
  year: number;
}

export class UpdateHolidayDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  holiday_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  holiday_date?: string;

  @ApiProperty({ enum: HolidayType, required: false })
  @IsOptional()
  @IsEnum(HolidayType)
  holiday_type?: HolidayType;

  @ApiProperty({ enum: HolidayAppliesTo, required: false })
  @IsOptional()
  @IsEnum(HolidayAppliesTo)
  applies_to?: HolidayAppliesTo;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  department_ids?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location_ids?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  recurring_month?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  recurring_day?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recurring_rule?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  can_work_for_ot?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiProperty({ enum: HolidayStatus, required: false })
  @IsOptional()
  @IsEnum(HolidayStatus)
  status?: HolidayStatus;
}

export class HolidayResponseDto {
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  id: number;

  @ApiProperty()
  holiday_name: string;

  @ApiProperty()
  holiday_date: Date;

  @ApiProperty({ enum: HolidayType })
  holiday_type: string;

  @ApiProperty({ enum: HolidayAppliesTo })
  applies_to: string;

  @ApiProperty({ required: false })
  department_ids?: string;

  @ApiProperty({ required: false })
  location_ids?: string;

  @ApiProperty()
  is_recurring: boolean;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value ? Number(value) : undefined)
  recurring_month?: number;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value ? Number(value) : undefined)
  recurring_day?: number;

  @ApiProperty({ required: false })
  recurring_rule?: string;

  @ApiProperty()
  is_mandatory: boolean;

  @ApiProperty()
  is_paid: boolean;

  @ApiProperty()
  can_work_for_ot: boolean;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  year: number;

  @ApiProperty({ enum: HolidayStatus })
  status: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class GetHolidaysQueryDto {
  @ApiProperty({ required: false, example: 2025 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  year?: number;

  @ApiProperty({ enum: HolidayType, required: false })
  @IsOptional()
  @IsEnum(HolidayType)
  holiday_type?: HolidayType;

  @ApiProperty({ enum: HolidayStatus, required: false })
  @IsOptional()
  @IsEnum(HolidayStatus)
  status?: HolidayStatus;
}

export class BulkCreateHolidayItemDto {
  @ApiProperty({ example: 'New Year' })
  @IsString()
  holiday_name: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  holiday_date: string;

  @ApiProperty({ enum: HolidayType })
  @IsEnum(HolidayType)
  holiday_type: HolidayType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BulkCreateHolidaysDto {
  @ApiProperty({ type: [BulkCreateHolidayItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateHolidayItemDto)
  holidays: BulkCreateHolidayItemDto[];

  @ApiProperty({ example: 2025 })
  @IsInt()
  year: number;

  @ApiProperty({ enum: HolidayAppliesTo, example: HolidayAppliesTo.ALL })
  @IsEnum(HolidayAppliesTo)
  applies_to: HolidayAppliesTo;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_paid: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_mandatory: boolean;
}

