import { ApiProperty } from '@nestjs/swagger';
import { GetRoleResponseDto } from './get-role-response.dto';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  total_pages: number;
}

export class GetRolesResponseDto {
  @ApiProperty({ type: [GetRoleResponseDto], description: 'List of roles' })
  roles: GetRoleResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  pagination: PaginationMetaDto;
}
