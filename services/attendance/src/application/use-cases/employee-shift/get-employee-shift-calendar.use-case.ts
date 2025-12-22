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
  EmployeeShiftDto,
} from '../../dtos/employee-shift-calendar.dto';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';

@Injectable()
export class GetEmployeeShiftCalendarUseCase {
  private readonly logger = new Logger(GetEmployeeShiftCalendarUseCase.name);

  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepo: IEmployeeWorkScheduleRepository,
    private readonly employeeServiceClient: EmployeeServiceClient,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
  ) {}

  async execute(
    query: EmployeeShiftCalendarQueryDto,
  ): Promise<ApiResponseDto<EmployeeShiftCalendarResponseDto>> {
    try {
      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;

      this.logger.log('Fetching work schedule assignments');

      // Step 1: Get ALL employees first (including those without assignments)
      this.logger.log('📋 Fetching ALL employees from employee service');
      let employeeMap = await this.employeeServiceClient.getAllEmployees();
      this.logger.log(`✅ Loaded ${employeeMap.size} total employees`);

      // Step 1.5: Filter out management roles using position.suggested_role
      // Exclude: DEPARTMENT_MANAGER, HR_MANAGER, ADMIN (only show regular EMPLOYEE)
      const excludedSuggestedRoles = ['DEPARTMENT_MANAGER', 'HR_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD', 'HR'];
      
      this.logger.log(`🔍 Starting position filter. Total employees: ${employeeMap.size}`);
      
      const employeeFilteredByPosition = Array.from(employeeMap.entries())
        .filter(([id, emp]) => {
          // If no position data, include by default
          if (!emp.position || !emp.position.suggested_role) {
            this.logger.debug(`Employee ${id} (${emp.full_name}): No position data, INCLUDED`);
            return true;
          }
          
          const isExcluded = excludedSuggestedRoles.includes(emp.position.suggested_role);
          this.logger.debug(
            `Employee ${id} (${emp.full_name}): suggested_role=${emp.position.suggested_role}, ${isExcluded ? 'EXCLUDED' : 'INCLUDED'}`
          );
          
          // Exclude management roles
          return !isExcluded;
        });
      
      this.logger.log(
        `🔍 After position filter (excluded ${excludedSuggestedRoles.join(', ')}): ${employeeFilteredByPosition.length} employees`,
      );

      if (employeeFilteredByPosition.length === 0) {
        return ApiResponseDto.success(
          { data: [], total: 0 },
          'No regular employees found',
        );
      }

      // Apply additional role filter if specified in query
      let roleFilteredEmployeeIds: number[];
      if (query.roles && query.roles.length > 0) {
        roleFilteredEmployeeIds = employeeFilteredByPosition
          .filter(([_, emp]) => query.roles!.includes(emp.role || 'EMPLOYEE'))
          .map(([id, _]) => id);
        
        this.logger.log(
          `🔍 After role filter (${query.roles.join(', ')}): ${roleFilteredEmployeeIds.length} employees`,
        );
      } else {
        // No additional role filter, use all position-filtered employees
        roleFilteredEmployeeIds = employeeFilteredByPosition.map(([id, _]) => id);
      }
      
      this.logger.log(
        `🔍 Final employee count after filters: ${roleFilteredEmployeeIds.length} employees`,
      );

      if (roleFilteredEmployeeIds.length === 0) {
        return ApiResponseDto.success(
          { data: [], total: 0 },
          'No employees found with specified roles',
        );
      }

      let targetEmployeeIds: number[] | undefined = roleFilteredEmployeeIds;

      // Step 2: Apply filters on employees
      if (query.employee_ids && query.employee_ids.length > 0) {
        // Filter by provided employee IDs (intersect with role-filtered IDs)
        const numericEmployeeIds = query.employee_ids.map((id) => Number(id));
        targetEmployeeIds = numericEmployeeIds.filter(id => roleFilteredEmployeeIds.includes(id));
        
        this.logger.log(`🔍 Filtering by employee_ids: [${targetEmployeeIds.join(', ')}]`);
      }

      // Apply employee_name filter
      if (query.employee_name) {
        const searchLower = query.employee_name.toLowerCase();
        const allEmployeeIds = targetEmployeeIds ?? Array.from(employeeMap.keys());
        
        const matchingEmployees = allEmployeeIds
          .map(id => employeeMap.get(id))
          .filter((emp): emp is EmployeeInfo => 
            emp !== undefined && emp.full_name.toLowerCase().includes(searchLower)
          );

        targetEmployeeIds = matchingEmployees.map((emp) => emp.id);
        
        this.logger.log(`🔍 After name filter "${query.employee_name}": ${targetEmployeeIds.length} employees`);

        if (targetEmployeeIds.length === 0) {
          return ApiResponseDto.success(
            { data: [], total: 0 },
            'No employees found matching search criteria',
          );
        }
      }

      // Apply department filter
      if (query.department_id) {
        const allEmployeeIds = targetEmployeeIds ?? Array.from(employeeMap.keys());
        
        const matchingEmployees = allEmployeeIds
          .map(id => employeeMap.get(id))
          .filter((emp): emp is EmployeeInfo => 
            emp !== undefined && emp.department_id === query.department_id
          );

        targetEmployeeIds = matchingEmployees.map((emp) => emp.id);
        
        this.logger.log(
          `🔍 After department filter (${query.department_id}): ${targetEmployeeIds.length} employees`,
        );

        if (targetEmployeeIds.length === 0) {
          return ApiResponseDto.success(
            { data: [], total: 0 },
            'No employees found in this department',
          );
        }
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
        // No filter provided - fetch all assignments
        const result = await this.employeeWorkScheduleRepo.findAllAssignments(
          999999, // Get all assignments first to group by employee
          0,
        );
        allAssignments = result.data as any[];
        this.logger.log(
          `📦 Fetched ${allAssignments.length} assignments from database`,
        );
      }

      // Step 3: Get assignments for employees
      // Group assignments by employee
      const assignmentsByEmployee = new Map<number, any[]>();
      allAssignments.forEach((assignment) => {
        const empId = Number(assignment.employee_id);
        if (!assignmentsByEmployee.has(empId)) {
          assignmentsByEmployee.set(empId, []);
        }
        assignmentsByEmployee.get(empId)!.push(assignment);
      });

      // Step 4: Determine which employees to show (all filtered employees, not just those with assignments)
      const allEmployeeIdsToShow = targetEmployeeIds ?? Array.from(employeeMap.keys());
      const total = allEmployeeIdsToShow.length;
      const paginatedEmployeeIds = allEmployeeIdsToShow.slice(offset, offset + limit);

      this.logger.log(
        `📊 Total employees (after filters): ${total}, Showing: ${paginatedEmployeeIds.length}`,
      );

      this.logger.log(
        `📊 Total employees: ${total}, Paginated: ${paginatedEmployeeIds.length}`,
      );

      // Fetch shifts for paginated employees
      // Use date range from query, or default to 90 days ago to today
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      let startDate: Date;
      let endDate: Date;
      
      if (query.start_date) {
        startDate = new Date(query.start_date);
        startDate.setHours(0, 0, 0, 0);
      } else {
        // Default: 90 days ago (increased from 30 to get more historical data)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
      }
      
      if (query.end_date) {
        endDate = new Date(query.end_date);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Default: today
        endDate = today;
      }

      this.logger.log(
        `📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      );

      let allShifts: any[] = [];
      if (paginatedEmployeeIds.length > 0) {
        allShifts =
          await this.employeeShiftRepository.findByEmployeeIdsAndDateRange(
            paginatedEmployeeIds,
            startDate,
            endDate,
          );
        this.logger.log(
          `📅 Fetched ${allShifts.length} shifts for ${paginatedEmployeeIds.length} employees`,
        );
      }

      // Group shifts by employee
      const shiftsByEmployee = new Map<number, any[]>();
      allShifts.forEach((shift) => {
        const empId = Number(shift.employee_id);
        if (!shiftsByEmployee.has(empId)) {
          shiftsByEmployee.set(empId, []);
        }
        shiftsByEmployee.get(empId)!.push(shift);
      });

      const employees: EmployeeCalendarDto[] = [];

      for (const employeeId of paginatedEmployeeIds) {
        const employeeInfo = employeeMap.get(employeeId);
        const assignments = assignmentsByEmployee.get(employeeId) || [];

        if (!employeeInfo) {
          this.logger.warn(
            `⚠️ Employee ID ${employeeId} (type: ${typeof employeeId}) not found in employeeMap`,
          );
          this.logger.debug(
            `Available keys in employeeMap: ${Array.from(employeeMap.keys()).join(', ')}`,
          );
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

        // Map shifts to DTO
        const shiftsForEmployee = shiftsByEmployee.get(employeeId) || [];
        const shiftDtos: EmployeeShiftDto[] = shiftsForEmployee.map(
          (shift: any) => ({
            shift_id: shift.id,
            shift_date: this.formatDate(shift.shift_date),
            start_time: shift.scheduled_start_time,
            end_time: shift.scheduled_end_time,
            break_duration_minutes: shift.break_duration_minutes,
            status: shift.status,
            work_schedule_id: shift.work_schedule_id,
            is_override: shift.shift_type === 'OVERTIME',
          }),
        );

        // Sort shifts by date (newest first)
        shiftDtos.sort((a, b) => b.shift_date.localeCompare(a.shift_date));

        employees.push({
          employee_id: employeeInfo.id,
          employee_code: employeeInfo.employee_code,
          full_name: employeeInfo.full_name,
          email: employeeInfo.email,
          department_name: employeeInfo.department_name ?? 'N/A',
          department_id: employeeInfo.department_id ?? 0,
          assignments: assignmentDtos,
          shifts: shiftDtos,
        });
      }

      employees.sort((a, b) => a.employee_code.localeCompare(b.employee_code));

      this.logger.log(
        `🎉 Final result: ${employees.length} employees with assignments`,
      );

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
