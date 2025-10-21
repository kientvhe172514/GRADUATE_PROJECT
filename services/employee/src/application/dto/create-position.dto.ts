import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({ description: 'Mã chức vụ', example: 'DEV001' })
  @IsString()
  position_code: string;

  @ApiProperty({ description: 'Tên chức vụ', example: 'Senior Developer' })
  @IsString()
  position_name: string;

  @ApiProperty({ description: 'Mô tả chức vụ', example: 'Phát triển phần mềm cấp cao', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Cấp bậc chức vụ', example: 3, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  level: number;

  @ApiProperty({ description: 'ID phòng ban', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  department_id?: number;

  @ApiProperty({ description: 'Vai trò đề xuất', example: 'DEVELOPER', required: false })
  @IsOptional()
  @IsString()
  suggested_role?: string;

  @ApiProperty({ description: 'Mức lương tối thiểu', example: 15000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary_min?: number;

  @ApiProperty({ description: 'Mức lương tối đa', example: 25000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary_max?: number;

  @ApiProperty({ description: 'Đơn vị tiền tệ', example: 'VND', default: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string = 'VND';
}
