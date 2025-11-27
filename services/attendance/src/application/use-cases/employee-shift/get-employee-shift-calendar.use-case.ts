import { Injectable, Inject, Logger } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import {
  EMPLOYEE_SHIFT_REPOSITORY,
  WORK_SCHEDULE_REPOSITORY,
} from '../../tokens';
import { IEmployeeShiftRepository } from '../../ports/employee-shift.repository.port';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { EmployeeServiceClient } from '../../../infrastructure/external-services/employee-service.client';
import { ShiftStatus } from '../../../domain/entities/employee-shift.entity';
import {
  EmployeeShiftCalendarQueryDto,
  EmployeeShiftCalendarResponseDto,
  EmployeeCalendarDto,
  ShiftCalendarItemDto,
} from '../../dtos/employee-shift-calendar.dto';

@Injectable()
export class GetEmployeeShiftCalendarUseCase {
  private readonly logger = new Logger(GetEmployeeShiftCalendarUseCase.name);

  constructor(
    @Inject(EMPLOYEE_SHIFT_REPOSITORY)
    private readonly shiftRepository: IEmployeeShiftRepository,
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
    private readonly employeeServiceClient: EmployeeServiceClient,
  ) {}

  async execute(
    query: EmployeeShiftCalendarQueryDto,
  ): Promise<ApiResponseDto<EmployeeShiftCalendarResponseDto>> {
    try {
      this.logger.log(
        `📅 Fetching calendar view: ${query.from_date} to ${query.to_date}`,
      );

      // 1. Fetch all shifts for the date range
      const from = new Date(query.from_date);
      const to = new Date(query.to_date);
      const allShifts = await this.shiftRepository.findByDateRange(from, to);

      this.logger.log(`📊 Found ${allShifts.length} shifts in date range`);

      // 2. Filter shifts based on query parameters
      let filteredShifts = allShifts;

      if (query.department_id) {
        filteredShifts = filteredShifts.filter(
          (shift) => shift.get_props().department_id === query.department_id,
        );
        this.logger.log(
          `🏢 Filtered to ${filteredShifts.length} shifts for department ${query.department_id}`,
        );
      }

      if (query.employee_ids && query.employee_ids.length > 0) {
        filteredShifts = filteredShifts.filter((shift) =>
          query.employee_ids!.includes(shift.get_props().employee_id),
        );
        this.logger.log(
          `👥 Filtered to ${filteredShifts.length} shifts for ${query.employee_ids.length} employees`,
        );
      }

      // 3. Group shifts by employee_id
      const shiftsByEmployee = new Map<number, typeof filteredShifts>();
      filteredShifts.forEach((shift) => {
        const props = shift.get_props();
        if (!shiftsByEmployee.has(props.employee_id)) {
          shiftsByEmployee.set(props.employee_id, []);
        }
        shiftsByEmployee.get(props.employee_id)!.push(shift);
      });

      this.logger.log(
        `👤 Grouped shifts for ${shiftsByEmployee.size} unique employees`,
      );

      // 4. Fetch employee details via RPC
      const employeeIds = Array.from(shiftsByEmployee.keys());
      const employeeMap =
        await this.employeeServiceClient.getEmployeesByIds(employeeIds);

      this.logger.log(
        `✅ Fetched details for ${employeeMap.size} employees via RPC`,
      );

      // 5. Fetch all unique work schedule IDs
      const scheduleIds = new Set<number>();
      filteredShifts.forEach((shift) => {
        const scheduleId = shift.get_props().work_schedule_id;
        if (scheduleId) {
          scheduleIds.add(scheduleId);
        }
      });

      // Fetch work schedules in parallel
      const scheduleMap = new Map<number, string>();
      await Promise.all(
        Array.from(scheduleIds).map(async (scheduleId) => {
          const schedule =
            await this.workScheduleRepository.findById(scheduleId);
          if (schedule) {
            scheduleMap.set(scheduleId, schedule.schedule_name);
          }
        }),
      );

      this.logger.log(`📋 Fetched ${scheduleMap.size} work schedule names`);

      // 6. Build response
      const employees: EmployeeCalendarDto[] = [];
      const missingEmployeeIds: number[] = [];

      for (const [employeeId, shifts] of shiftsByEmployee.entries()) {
        const employeeInfo = employeeMap.get(employeeId);

        // Track missing employee but still show shifts with partial info
        if (!employeeInfo) {
          this.logger.warn(
            `⚠️ Employee info not found for ID: ${employeeId} - Employee may have been deleted`,
          );
          missingEmployeeIds.push(employeeId);
          
          // Create placeholder employee info with shifts
          const shiftItems: ShiftCalendarItemDto[] = shifts.map((shift) => {
            const props = shift.get_props();
            const scheduleName = props.work_schedule_id
              ? scheduleMap.get(props.work_schedule_id) || 'Unknown Schedule'
              : 'No Schedule';

            return {
              shift_id: props.id!,
              shift_date: this.formatShiftDate(props.shift_date),
              schedule_name: scheduleName,
              start_time: props.scheduled_start_time,
              end_time: props.scheduled_end_time,
              status: props.status ?? ShiftStatus.SCHEDULED,
              shift_type: props.shift_type || 'REGULAR',
              check_in_time: props.check_in_time
                ? this.formatTime(props.check_in_time)
                : undefined,
              check_out_time: props.check_out_time
                ? this.formatTime(props.check_out_time)
                : undefined,
              work_hours: props.work_hours ?? 0,
              overtime_hours: props.overtime_hours ?? 0,
              late_minutes: props.late_minutes ?? 0,
              early_leave_minutes: props.early_leave_minutes ?? 0,
            };
          });

          shiftItems.sort((a, b) => a.shift_date.localeCompare(b.shift_date));

          employees.push({
            employee_id: employeeId,
            employee_code: `DELETED_${employeeId}`,
            full_name: `[Employee Not Found - ID: ${employeeId}]`,
            department_name: 'N/A',
            department_id: 0,
            shifts: shiftItems,
          });
          
          continue;
        }

        // Map shifts to calendar items
        const shiftItems: ShiftCalendarItemDto[] = shifts.map((shift) => {
          const props = shift.get_props();
          const scheduleName = props.work_schedule_id
            ? scheduleMap.get(props.work_schedule_id) || 'Unknown Schedule'
            : 'No Schedule';

          return {
            shift_id: props.id!,
            shift_date: this.formatShiftDate(props.shift_date),
            schedule_name: scheduleName,
            start_time: props.scheduled_start_time,
            end_time: props.scheduled_end_time,
            status: props.status ?? ShiftStatus.SCHEDULED,
            shift_type: props.shift_type || 'REGULAR',
            check_in_time: props.check_in_time
              ? this.formatTime(props.check_in_time)
              : undefined,
            check_out_time: props.check_out_time
              ? this.formatTime(props.check_out_time)
              : undefined,
            work_hours: props.work_hours ?? 0,
            overtime_hours: props.overtime_hours ?? 0,
            late_minutes: props.late_minutes ?? 0,
            early_leave_minutes: props.early_leave_minutes ?? 0,
          };
        });

        // Sort shifts by date
        shiftItems.sort((a, b) => a.shift_date.localeCompare(b.shift_date));

        employees.push({
          employee_id: employeeInfo.id,
          employee_code: employeeInfo.employee_code,
          full_name: employeeInfo.full_name,
          department_name: 'N/A', // Will be fetched later if needed
          department_id: employeeInfo.department_id ?? 0,
          shifts: shiftItems,
        });
      }

      // Sort employees by employee_code
      employees.sort((a, b) => a.employee_code.localeCompare(b.employee_code));

      const response: EmployeeShiftCalendarResponseDto = {
        from_date: query.from_date,
        to_date: query.to_date,
        total_employees: employees.length,
        employees,
      };

      let message = 'Employee shift calendar retrieved successfully';
      if (missingEmployeeIds.length > 0) {
        message += ` (Warning: ${missingEmployeeIds.length} employee(s) not found: ${missingEmployeeIds.join(', ')})`;
        this.logger.warn(
          `⚠️ ${missingEmployeeIds.length} employee(s) not found in Employee Service: ${missingEmployeeIds.join(', ')}`,
        );
      }

      this.logger.log(
        `✨ Calendar view generated for ${employees.length} employees`,
      );

      return ApiResponseDto.success(response, message);
    } catch (error) {
      this.logger.error('❌ Failed to get calendar view:', error);
      throw error;
    }
  }

  /**
   * Format Date to HH:MM string
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Safely convert shift_date to ISO string (YYYY-MM-DD)
   * Handles both Date objects and string inputs
   */
  private formatShiftDate(shiftDate: Date | string): string {
    if (!shiftDate) {
      this.logger.warn('⚠️ shift_date is null or undefined');
      return new Date().toISOString().split('T')[0];
    }

    try {
      // If already a Date object
      if (shiftDate instanceof Date) {
        return shiftDate.toISOString().split('T')[0];
      }
      
      // If string, convert to Date first
      if (typeof shiftDate === 'string') {
        return new Date(shiftDate).toISOString().split('T')[0];
      }

      // Fallback: try to convert whatever it is to Date
      return new Date(shiftDate as any).toISOString().split('T')[0];
    } catch (error) {
      this.logger.error(`❌ Error formatting shift_date: ${shiftDate}`, error);
      return new Date().toISOString().split('T')[0];
    }
  }
}
