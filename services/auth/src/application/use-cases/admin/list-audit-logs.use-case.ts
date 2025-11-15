import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { AuditLogsRepositoryPort } from '../../ports/audit-logs.repository.port';
import { AUDIT_LOGS_REPOSITORY } from '../../tokens';
import { 
  ListAuditLogsRequestDto, 
  ListAuditLogsResponseDto, 
  AuditLogSummaryDto, 
  PaginationDto 
} from '../../dto/admin/list-audit-logs.dto';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
  ) {}

  async execute(dto: ListAuditLogsRequestDto): Promise<ApiResponseDto<ListAuditLogsResponseDto>> {
    try {
      // Validate pagination parameters
      const page = Math.max(1, dto.page || 1);
      const limit = Math.min(100, Math.max(1, dto.limit || 10));
      const offset = (page - 1) * limit;

      // Build search criteria - explicitly check for values
      const searchCriteria: any = {};
      
      if (dto.account_id !== undefined && dto.account_id !== null) {
        searchCriteria.account_id = dto.account_id;
      }
      
      if (dto.action !== undefined && dto.action !== null && dto.action !== '') {
        searchCriteria.action = dto.action;
      }
      
      if (dto.success !== undefined && dto.success !== null) {
        searchCriteria.success = dto.success;
      }

      // Parse date filters
      if (dto.start_date !== undefined && dto.start_date !== null && dto.start_date !== '') {
        searchCriteria.start_date = new Date(dto.start_date);
      }
      
      if (dto.end_date !== undefined && dto.end_date !== null && dto.end_date !== '') {
        searchCriteria.end_date = new Date(dto.end_date);
      }

      // Get audit logs with pagination
      const { logs, total } = await this.auditLogsRepo.findWithPagination({
        ...searchCriteria,
        limit,
        offset,
        sortBy: dto.sort_by || 'created_at',
        sortOrder: dto.sort_order || 'DESC',
      });

      // Map to DTOs
      const logSummaries: AuditLogSummaryDto[] = logs.map(log => ({
        id: log.id!,
        account_id: log.account_id || null,
        email: log.metadata?.email || null,
        action: log.action,
        success: log.success,
        ip_address: log.ip_address || null,
        user_agent: log.user_agent || null,
        error_message: log.error_message || null,
        metadata: log.metadata,
        created_at: log.created_at!,
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

      const response: ListAuditLogsResponseDto = {
        logs: logSummaries,
        pagination,
      };

      return ApiResponseDto.success(response, 'Audit logs retrieved successfully', 200, undefined, 'AUDIT_LOGS_RETRIEVED');
    } catch (error) {
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve audit logs');
    }
  }
}
