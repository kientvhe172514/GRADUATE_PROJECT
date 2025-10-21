import { ApiProperty } from '@nestjs/swagger';
import { PositionResponseDto } from './position-response.dto';

export class PositionListResponseDto {
  @ApiProperty({ description: 'Danh sách chức vụ', type: [PositionResponseDto] })
  positions: PositionResponseDto[];

  @ApiProperty({ description: 'Tổng số chức vụ', example: 10 })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  page: number;

  @ApiProperty({ description: 'Số lượng mỗi trang', example: 10 })
  limit: number;
}
