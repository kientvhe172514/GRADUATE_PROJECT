import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { Position } from '../../domain/entities/position.entity';
import { POSITION_REPOSITORY } from '../tokens';
import { 
  ListPositionDto, 
  ListPositionResponseDto, 
  PositionSummaryDto, 
  PaginationDto 
} from '../dto/position/list-position.dto';

@Injectable()
export class GetAllPositionsUseCase {
  constructor(@Inject(POSITION_REPOSITORY) private readonly positionRepository: PositionRepositoryPort) {}

  async execute(dto: ListPositionDto): Promise<ApiResponseDto<ListPositionResponseDto>> {
    try {
      // Validate pagination parameters
      const page = Math.max(1, dto.page || 1);
      const limit = Math.min(100, Math.max(1, dto.limit || 10));
      const offset = (page - 1) * limit;

      // Build search criteria - explicitly check for values
      const searchCriteria: any = {};
      
      if (dto.status !== undefined && dto.status !== null && dto.status !== '') {
        searchCriteria.status = dto.status;
      }
      
      if (dto.department_id !== undefined && dto.department_id !== null) {
        searchCriteria.department_id = dto.department_id;
      }

      // Get positions with pagination
      const criteria = {
        ...searchCriteria,
        search: dto.search,
        limit,
        offset,
        sortBy: dto.sort_by || 'created_at',
        sortOrder: dto.sort_order || 'DESC',
      };
      
      const { positions, total } = await this.positionRepository.findWithPagination(criteria);

      // Map to DTOs
      const positionSummaries: PositionSummaryDto[] = positions.map(position => ({
        id: position.id!,
        position_code: position.position_code,
        position_name: position.position_name,
        description: position.description,
        level: position.level,
        department_id: position.department_id,
        department_name: position.department_name,
        suggested_role: position.suggested_role,
        salary_min: position.salary_min,
        salary_max: position.salary_max,
        currency: position.currency,
        status: position.status,
        created_at: position.created_at!,
        updated_at: position.updated_at!,
      }));

      // Build pagination info
      const totalPages = Math.ceil(total / limit);
      const pagination: PaginationDto = {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      };

      const response: ListPositionResponseDto = {
        positions: positionSummaries,
        pagination,
      };

      return ApiResponseDto.success(response, 'Positions retrieved successfully', 200, undefined, 'POSITIONS_RETRIEVED');
    } catch (error) {
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve positions');
    }
  }
}
