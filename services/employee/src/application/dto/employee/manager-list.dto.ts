import { ApiProperty } from '@nestjs/swagger';
import { BaseEmployeeFilterDto } from './base-employee-filter.dto';

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

/**
 * DTO for listing managers
 * Extends BaseEmployeeFilterDto to reuse common filters
 */
export class ListManagersDto extends BaseEmployeeFilterDto {
  // No additional fields needed - all filters inherited from base
}

export class ListManagersResponseDto {
  @ApiProperty({ type: [ManagerSummaryDto] })
  managers: ManagerSummaryDto[];

  @ApiProperty({ example: 10 })
  total: number;
}
