import { ApiProperty } from '@nestjs/swagger';

export class PositionResponseDto {
  @ApiProperty({ description: 'ID chức vụ', example: 1 })
  id: number;

  @ApiProperty({ description: 'Mã chức vụ', example: 'DEV001' })
  position_code: string;

  @ApiProperty({ description: 'Tên chức vụ', example: 'Senior Developer' })
  position_name: string;

  @ApiProperty({ description: 'Mô tả chức vụ', example: 'Phát triển phần mềm cấp cao', required: false })
  description?: string;

  @ApiProperty({ description: 'Cấp bậc chức vụ', example: 3 })
  level: number;

  @ApiProperty({ description: 'ID phòng ban', example: 1, required: false })
  department_id?: number;

  @ApiProperty({ description: 'Vai trò đề xuất', example: 'DEVELOPER', required: false })
  suggested_role?: string;

  @ApiProperty({ description: 'Mức lương tối thiểu', example: 15000000, required: false })
  salary_min?: number;

  @ApiProperty({ description: 'Mức lương tối đa', example: 25000000, required: false })
  salary_max?: number;

  @ApiProperty({ description: 'Đơn vị tiền tệ', example: 'VND' })
  currency: string;

  @ApiProperty({ description: 'Trạng thái', example: 'ACTIVE' })
  status: string;

  @ApiProperty({ description: 'Thời gian tạo', example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ description: 'Thời gian cập nhật', example: '2024-01-01T00:00:00.000Z' })
  updated_at: Date;
}
