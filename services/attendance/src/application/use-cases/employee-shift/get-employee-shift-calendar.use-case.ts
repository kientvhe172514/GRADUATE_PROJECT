import { Injectable, Inject, Logger } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../tokens';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import {
  EmployeeServiceClient,
  EmployeeInfo,
} from '../../../infrastructure/external-services/employee-service.client';
import {
  EmployeeShiftCalendarQueryDto,
  EmployeeShiftCalendarResponseDto,
  EmployeeCalendarDto,
  WorkScheduleAssignmentDto,
} from '../../dtos/employee-shift-calendar.dto';

@Injectable()
export class GetEmployeeShiftCalendarUseCase {
  private readonly logger = new Logger(GetEmployeeShiftCalendarUseCase.name);

  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepo: IEmployeeWorkScheduleRepository,
    private readonly employeeServiceClient: EmployeeServiceClient,
  ) {}

  async execute(
    query: EmployeeShiftCalendarQueryDto,
  ): Promise<ApiResponseDto<EmployeeShiftCalendarResponseDto>> {
    try {
      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;

      this.logger.log('Fetching work schedule assignments');

      let employeeMap = new Map<number, EmployeeInfo>();
      let targetEmployeeIds: number[] | undefined;

      // Step 1: Determine target employee IDs
      if (query.employee_ids && query.employee_ids.length > 0) {
        // Fetch employee info first
        employeeMap = await this.employeeServiceClient.getEmployeesByIds(
          query.employee_ids,
        );

        // If employee_name search is provided, filter by name
        if (query.employee_name) {
          const searchLower = query.employee_name.toLowerCase();
          const matchingEmployees = Array.from(employeeMap.values()).filter(
            (emp) => emp.full_name.toLowerCase().includes(searchLower),
          );

          targetEmployeeIds = matchingEmployees.map((emp) => emp.id);

          if (targetEmployeeIds.length === 0) {
            return ApiResponseDto.success(
              { data: [], total: 0 },
              'No employees found matching search criteria',
            );
          }
        } else {
          // Use all provided employee IDs
          targetEmployeeIds = query.employee_ids;
        }
      } else if (query.employee_name) {
        // If only employee_name provided without IDs, we can't search
        return ApiResponseDto.success(
          { data: [], total: 0 },
          'Please provide employee_ids when searching by name',
        );
      }

      type AssignmentWithSchedule = {
        id: number;
        employee_id: number;
        work_schedule_id: number;
        effective_from: Date;
        effective_to?: Date;
        work_schedule?: any;
      };

      let allAssignments: AssignmentWithSchedule[] = [];

      if (targetEmployeeIds && targetEmployeeIds.length > 0) {
        // Fetch assignments for specific employee IDs
        for (const empId of targetEmployeeIds) {
          const assignments =
            await this.employeeWorkScheduleRepo.findAssignmentsByEmployeeId(
              empId,
            );
          allAssignments.push(...(assignments as any[]));
        }
      } else {
        // No filter provided - fetch all assignments with pagination
        const result = await this.employeeWorkScheduleRepo.findAllAssignments(
          limit,
          offset,
        );
        allAssignments = result.data as any[];

        // Get unique employee IDs from assignments
        const employeeIds = [
          ...new Set(allAssignments.map((a) => a.employee_id)),
        ] as number[];

        if (employeeIds.length > 0) {
          employeeMap =
            await this.employeeServiceClient.getEmployeesByIds(employeeIds);
        }

        // Apply department filter if provided
        if (query.department_id) {
          const filteredEmpIds = Array.from(employeeMap.values())
            .filter((emp) => emp.department_id === query.department_id)
            .map((emp) => emp.id);

          allAssignments = allAssignments.filter((a) =>
            filteredEmpIds.includes(a.employee_id),
          );
        }

        // Group by employee and paginate
        const assignmentsByEmployee = new Map<number, any[]>();
        allAssignments.forEach((assignment) => {
          if (!assignmentsByEmployee.has(assignment.employee_id)) {
            assignmentsByEmployee.set(assignment.employee_id, []);
          }
          assignmentsByEmployee.get(assignment.employee_id)!.push(assignment);
        });

        const employeeIdsToShow = Array.from(assignmentsByEmployee.keys());
        const total = employeeIdsToShow.length;

        const employees: EmployeeCalendarDto[] = [];

        for (const employeeId of employeeIdsToShow) {
          const employeeInfo = employeeMap.get(employeeId);
          const assignments = assignmentsByEmployee.get(employeeId) || [];

          if (!employeeInfo) {
            continue;
          }

          const assignmentDtos: WorkScheduleAssignmentDto[] = assignments.map(
            (assignment) => {
              const ws = (assignment as any).work_schedule;
              const assignmentEntity = assignment as any;
              return {
                assignment_id: assignment.id,
                work_schedule_id: assignment.work_schedule_id,
                effective_from: this.formatDate(assignment.effective_from),
                effective_to: assignment.effective_to
                  ? this.formatDate(assignment.effective_to)
                  : undefined,
                work_schedule: ws
                  ? {
                      id: ws.id,
                      schedule_name: ws.schedule_name,
                      schedule_type: ws.schedule_type,
                      start_time: ws.start_time,
                      end_time: ws.end_time,
                      break_duration_minutes: ws.break_duration_minutes,
                      late_tolerance_minutes: ws.late_tolerance_minutes,
                      early_leave_tolerance_minutes:
                        ws.early_leave_tolerance_minutes,
                      status: ws.status,
                    }
                  : {
                      id: 0,
                      schedule_name: 'Unknown',
                      schedule_type: 'UNKNOWN',
                      start_time: undefined,
                      end_time: undefined,
                      break_duration_minutes: 0,
                      late_tolerance_minutes: 0,
                      early_leave_tolerance_minutes: 0,
                      status: 'UNKNOWN',
                    },
                schedule_overrides:
                  assignmentEntity.schedule_overrides &&
                  Array.isArray(assignmentEntity.schedule_overrides)
                    ? assignmentEntity.schedule_overrides
                    : [],
              };
            },
          );

          assignmentDtos.sort((a, b) =>
            b.effective_from.localeCompare(a.effective_from),
          );

          employees.push({
            employee_id: employeeInfo.id,
            employee_code: employeeInfo.employee_code,
            full_name: employeeInfo.full_name,
            email: employeeInfo.email,
            department_name: 'N/A',
            department_id: employeeInfo.department_id ?? 0,
            assignments: assignmentDtos,
          });
        }

        employees.sort((a, b) =>
          a.employee_code.localeCompare(b.employee_code),
        );

        const response: EmployeeShiftCalendarResponseDto = {
          data: employees,
          total,
        };

        return ApiResponseDto.success(
          response,
          'Work schedule assignments retrieved successfully',
        );
      }

      const employeeIds = [
        ...new Set(allAssignments.map((a) => a.employee_id)),
      ] as number[];

      if (employeeMap.size === 0 && employeeIds.length > 0) {
        employeeMap =
          await this.employeeServiceClient.getEmployeesByIds(employeeIds);
      }

      if (query.department_id) {
        const filteredEmpIds = Array.from(employeeMap.values())
          .filter((emp) => emp.department_id === query.department_id)
          .map((emp) => emp.id);

        allAssignments = allAssignments.filter((a) =>
          filteredEmpIds.includes(a.employee_id),
        );
      }

      const assignmentsByEmployee = new Map<number, any[]>();
      allAssignments.forEach((assignment) => {
        if (!assignmentsByEmployee.has(assignment.employee_id)) {
          assignmentsByEmployee.set(assignment.employee_id, []);
        }
        assignmentsByEmployee.get(assignment.employee_id)!.push(assignment);
      });

      const employeeIdsToShow = Array.from(assignmentsByEmployee.keys());
      const total = employeeIdsToShow.length;
      const paginatedEmployeeIds = employeeIdsToShow.slice(
        offset,
        offset + limit,
      );

      const employees: EmployeeCalendarDto[] = [];

      for (const employeeId of paginatedEmployeeIds) {
        const employeeInfo = employeeMap.get(employeeId);
        const assignments = assignmentsByEmployee.get(employeeId) || [];

        if (!employeeInfo) {
          continue;
        }

        const assignmentDtos: WorkScheduleAssignmentDto[] = assignments.map(
          (assignment) => {
            const ws = (assignment as any).work_schedule;
            const assignmentEntity = assignment as any;
            return {
              assignment_id: assignment.id,
              work_schedule_id: assignment.work_schedule_id,
              effective_from: this.formatDate(assignment.effective_from),
              effective_to: assignment.effective_to
                ? this.formatDate(assignment.effective_to)
                : undefined,
              work_schedule: ws
                ? {
                    id: ws.id,
                    schedule_name: ws.schedule_name,
                    schedule_type: ws.schedule_type,
                    start_time: ws.start_time,
                    end_time: ws.end_time,
                    break_duration_minutes: ws.break_duration_minutes,
                    late_tolerance_minutes: ws.late_tolerance_minutes,
                    early_leave_tolerance_minutes:
                      ws.early_leave_tolerance_minutes,
                    status: ws.status,
                  }
                : {
                    id: 0,
                    schedule_name: 'Unknown',
                    schedule_type: 'UNKNOWN',
                    start_time: undefined,
                    end_time: undefined,
                    break_duration_minutes: 0,
                    late_tolerance_minutes: 0,
                    early_leave_tolerance_minutes: 0,
                    status: 'UNKNOWN',
                  },
              schedule_overrides:
                assignmentEntity.schedule_overrides &&
                Array.isArray(assignmentEntity.schedule_overrides)
                  ? assignmentEntity.schedule_overrides
                  : [],
            };
          },
        );

        assignmentDtos.sort((a, b) =>
          b.effective_from.localeCompare(a.effective_from),
        );

        employees.push({
          employee_id: employeeInfo.id,
          employee_code: employeeInfo.employee_code,
          full_name: employeeInfo.full_name,
          email: employeeInfo.email,
          department_name: 'N/A',
          department_id: employeeInfo.department_id ?? 0,
          assignments: assignmentDtos,
        });
      }

      employees.sort((a, b) => a.employee_code.localeCompare(b.employee_code));

      const response: EmployeeShiftCalendarResponseDto = {
        data: employees,
        total,
      };

      return ApiResponseDto.success(
        response,
        'Work schedule assignments retrieved successfully',
      );
    } catch (error) {
      this.logger.error('Failed to get work schedule assignments:', error);
      throw error;
    }
  }

  private formatDate(date: Date | string): string {
    if (!date) return new Date().toISOString().split('T')[0];

    try {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      if (typeof date === 'string') {
        return new Date(date).toISOString().split('T')[0];
      }
      return new Date(date as any).toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  }
}
