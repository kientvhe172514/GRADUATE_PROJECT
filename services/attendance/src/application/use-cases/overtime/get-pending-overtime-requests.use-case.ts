import { Injectable, Logger } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import {
  EmployeeServiceClient,
  EmployeeInfo,
} from '../../../infrastructure/external-services/employee-service.client';

@Injectable()
export class GetPendingOvertimeRequestsUseCase {
  private readonly logger = new Logger(GetPendingOvertimeRequestsUseCase.name);

  constructor(
    private readonly overtimeRepo: OvertimeRequestRepository,
    private readonly employeeServiceClient: EmployeeServiceClient,
  ) {}

  async execute(
    limit = 50,
    offset = 0,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    const requests = await this.overtimeRepo.findPendingRequests(limit, offset);

    // Extract unique employee IDs from overtime requests
    const employeeIds = [
      ...new Set(requests.map((request) => Number(request.employee_id))),
    ] as number[];

    // Fetch employee information in batch
    let employeeMap = new Map<number, EmployeeInfo>();
    if (employeeIds.length > 0) {
      try {
        this.logger.log(
          `🔍 Fetching ${employeeIds.length} employees for ${requests.length} pending overtime requests`,
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
      }
    }

    // Enrich overtime requests with employee information
    const enrichedRequests = requests.map((request) => {
      const employee = employeeMap.get(request.employee_id);
      return {
        ...request,
        employee_code: employee?.employee_code ?? null,
        employee_name: employee?.full_name ?? null,
        employee_email: employee?.email ?? null,
        department_id: employee?.department_id ?? null,
      };
    });

    return ApiResponseDto.success(
      { data: enrichedRequests, total: enrichedRequests.length },
      'Pending overtime requests retrieved successfully',
    );
  }
}
