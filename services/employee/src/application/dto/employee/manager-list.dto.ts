import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ManagerSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'EMP001' })
  employee_code: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  full_name: string;

  @ApiProperty({ example: 'a@company.com' })
  email: string;

  @ApiProperty({ example: 1, required: false })
  department_id?: number;

  @ApiProperty({ example: 'Phòng Công Nghệ Thông Tin', required: false })
  department_name?: string;

  @ApiProperty({ example: 1, required: false })
  position_id?: number;

  @ApiProperty({ example: 'Trưởng Phòng', required: false })
  position_name?: string;
}

export class ListManagersDto {
  @ApiProperty({ required: false, type: String, description: 'Tìm kiếm theo mã nhân viên, email hoặc họ tên (hỗ trợ tiếng Việt có dấu)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, type: Number, description: 'Lọc theo phòng ban' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id?: number;

  @ApiProperty({ required: false, type: Number, description: 'Lọc theo vị trí' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  position_id?: number;
}

export class ListManagersResponseDto {
  @ApiProperty({ type: [ManagerSummaryDto] })
  managers: ManagerSummaryDto[];

  @ApiProperty({ example: 10 })
  total: number;
}
