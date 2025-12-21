import { Injectable, Logger } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { OvertimeQueryDto } from '../../dtos/overtime-request.dto';
import {
  EmployeeServiceClient,
  EmployeeInfo,
} from '../../../infrastructure/external-services/employee-service.client';

@Injectable()
export class ListOvertimeRequestsUseCase {
  private readonly logger = new Logger(ListOvertimeRequestsUseCase.name);

  constructor(
    private readonly overtimeRepo: OvertimeRequestRepository,
    private readonly employeeServiceClient: EmployeeServiceClient,
  ) {}

  async execute(
    query: OvertimeQueryDto,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const requests = query.status
      ? await this.overtimeRepo.findByStatus(query.status, limit, offset)
      : await this.overtimeRepo.find({
          take: limit,
          skip: offset,
          order: { created_at: 'DESC' },
        });

    // Extract unique employee IDs from overtime requests
    const employeeIds = [
      ...new Set(requests.map((request) => Number(request.employee_id))),
    ] as number[];

    // Fetch employee information in batch (one call to employee service)
    let employeeMap = new Map<number, EmployeeInfo>();
    if (employeeIds.length > 0) {
      try {
        this.logger.log(
          `🔍 Fetching ${employeeIds.length} employees for ${requests.length} overtime requests`,
        );
        employeeMap =
          await this.employeeServiceClient.getEmployeesByIds(employeeIds);
        this.logger.log(
          `✅ Successfully fetched ${employeeMap.size} employees`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Failed to fetch employees, continuing without names:`,
          error,
        );
        // Continue without employee names if service is unavailable
      }
    }

    // Enrich overtime requests with employee information
    let enrichedRequests = requests.map((request) => {
      const employee = employeeMap.get(request.employee_id);
      return {
        ...request,
        employee_code: employee?.employee_code ?? null,
        employee_name: employee?.full_name ?? null,
        employee_email: employee?.email ?? null,
        department_id: employee?.department_id ?? null,
      };
    });

    // ✅ NEW: Filter by department_id if provided
    if (query.department_id) {
      enrichedRequests = enrichedRequests.filter(
        (request) => request.department_id === query.department_id,
      );
      this.logger.log(
        `🔍 Filtered to ${enrichedRequests.length} requests for department ${query.department_id}`,
      );
    }

    return ApiResponseDto.success(
      {
        data: enrichedRequests,
        total: enrichedRequests.length,
      },
      'Overtime requests retrieved successfully',
    );
  }
}
