import { Injectable, Inject } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { EMPLOYEE_SHIFT_REPOSITORY } from '../../tokens';
import { IEmployeeShiftRepository } from '../../ports/employee-shift.repository.port';
import {
  GetMyAttendanceQueryDto,
  GetMyAttendanceResponseDto,
  AttendancePeriodFilter,
  AttendanceSummaryDto,
  MyAttendanceShiftDto,
  PaginationMetaDto,
} from '../../../presentation/dtos/my-attendance.dto';
import { ShiftStatus } from '../../../domain/entities/employee-shift.entity';

/**
 * ✅ QUY TẮC: Use Case Pattern
 * Purpose: Get employee's own attendance with period filtering
 * Input: GetMyAttendanceQueryDto + JwtPayload (current user)
 * Output: ApiResponseDto<GetMyAttendanceResponseDto>
 * Business Logic:
 * - DAY: Only the selected date
 * - WEEK: From Monday of the week to reference_date (current date)
 * - MONTH: From 1st of the month to reference_date (current date)
 * - YEAR: From Jan 1 to reference_date (current date)
 * - Get ALL attendance records (including weekends, based on work schedule)
 * - Calculate attendance summary (total days, present, absent, late, etc.)
 * - Support pagination
 */

@Injectable()
export class GetMyAttendanceUseCase {
  constructor(
    @Inject(EMPLOYEE_SHIFT_REPOSITORY)
    private readonly shiftRepository: IEmployeeShiftRepository,
  ) {}

  async execute(
    query: GetMyAttendanceQueryDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<GetMyAttendanceResponseDto>> {
    // Validate employee_id from JWT
    if (!currentUser.employee_id) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Employee ID not found in token',
      );
    }

    // Support both new (start_date + end_date) and old (period + reference_date) formats
    let startDate: Date;
    let endDate: Date;

    if (query.start_date && query.end_date) {
      // ✅ NEW: Direct date range
      startDate = new Date(query.start_date);
      endDate = new Date(query.end_date);
      console.log(
        `📅 Using custom date range: ${query.start_date} → ${query.end_date}`,
      );
    } else if (query.period && query.reference_date) {
      // 🔄 DEPRECATED: Period-based calculation
      const referenceDate = new Date(query.reference_date);
      const range = this.calculatePeriodRange(referenceDate, query.period);
      startDate = range.startDate;
      endDate = range.endDate;
      console.log(
        `📅 Using period ${query.period} with reference ${query.reference_date}`,
      );
    } else {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Either provide start_date + end_date OR period + reference_date',
      );
    }

    // Fetch all shifts in the period for this employee
    const allShifts = await this.shiftRepository.findByDateRange(
      startDate,
      endDate,
    );

    // Filter by employee_id and optional status
    let filteredShifts = allShifts.filter((shift) => {
      const props = shift.get_props();
      if (props.employee_id !== currentUser.employee_id) {
        return false;
      }
      if (query.status && props.status !== query.status) {
        return false;
      }
      return true;
    });

    // Sort by shift_date descending (newest first)
    filteredShifts = filteredShifts.sort((a, b) => {
      const propsA = a.get_props();
      const propsB = b.get_props();
      const dateA =
        propsA.shift_date instanceof Date
          ? propsA.shift_date
          : new Date(propsA.shift_date);
      const dateB =
        propsB.shift_date instanceof Date
          ? propsB.shift_date
          : new Date(propsB.shift_date);
      return dateB.getTime() - dateA.getTime();
    });

    // Calculate summary
    const summary = this.calculateSummary(filteredShifts);

    // Pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const total = filteredShifts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const paginatedShifts = filteredShifts.slice(offset, offset + limit);

    // Map to DTOs
    const shifts: MyAttendanceShiftDto[] = paginatedShifts.map((shift) =>
      this.mapToDto(shift),
    );

    const pagination: PaginationMetaDto = {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };

    const response: GetMyAttendanceResponseDto = {
      summary,
      shifts,
      pagination,
      period_start: this.formatDate(startDate),
      period_end: this.formatDate(endDate),
    };

    return ApiResponseDto.success(
      response,
      'My attendance retrieved successfully',
      200,
      undefined,
      'MY_ATTENDANCE_RETRIEVED',
    );
  }

  /**
   * Calculate period range based on reference date and period type
   * Logic:
   * - DAY: Only reference_date
   * - WEEK: From Monday of the week to reference_date
   * - MONTH: From 1st of the month to reference_date
   * - YEAR: From Jan 1 to reference_date
   * Note: Get ALL dates (including weekends) - work schedule will define actual working days
   */
  private calculatePeriodRange(
    referenceDate: Date,
    period: AttendancePeriodFilter,
  ): { startDate: Date; endDate: Date } {
    let startDate: Date;
    const endDate: Date = new Date(referenceDate); // Always end at reference_date

    switch (period) {
      case AttendancePeriodFilter.DAY:
        // Single day only
        startDate = new Date(referenceDate);
        break;

      case AttendancePeriodFilter.WEEK:
        // From Monday of the week to reference_date
        startDate = this.getMonday(referenceDate);
        break;

      case AttendancePeriodFilter.MONTH:
        // From 1st of the month to reference_date
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        startDate = new Date(year, month, 1);
        break;

      case AttendancePeriodFilter.YEAR:
        // From Jan 1 to reference_date
        const currentYear = referenceDate.getFullYear();
        startDate = new Date(currentYear, 0, 1);
        break;

      default:
        throw new BusinessException(
          ErrorCodes.INVALID_INPUT,
          'Invalid period filter',
        );
    }

    return { startDate, endDate };
  }

  /**
   * Get Monday of the week containing the given date
   */
  private getMonday(date: Date): Date {
    const day = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; else go to Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    return monday;
  }

  /**
   * Calculate attendance summary from shifts
   */
  private calculateSummary(shifts: any[]): AttendanceSummaryDto {
    let totalWorkingDays = 0;
    let daysPresent = 0;
    let daysAbsent = 0;
    let daysOnLeave = 0;
    let totalWorkHours = 0;
    let totalOvertimeHours = 0;
    let timesLate = 0;
    let totalLateMinutes = 0;
    let timesEarlyLeave = 0;
    let totalEarlyLeaveMinutes = 0;

    for (const shift of shifts) {
      const props = shift.get_props();
      totalWorkingDays++;

      switch (props.status) {
        case ShiftStatus.COMPLETED:
        case ShiftStatus.IN_PROGRESS:
          daysPresent++;
          break;
        case ShiftStatus.ABSENT:
          daysAbsent++;
          break;
        case ShiftStatus.ON_LEAVE:
          daysOnLeave++;
          break;
      }

      totalWorkHours += props.work_hours ?? 0;
      totalOvertimeHours += props.overtime_hours ?? 0;

      if (props.late_minutes && props.late_minutes > 0) {
        timesLate++;
        totalLateMinutes += props.late_minutes;
      }

      if (props.early_leave_minutes && props.early_leave_minutes > 0) {
        timesEarlyLeave++;
        totalEarlyLeaveMinutes += props.early_leave_minutes;
      }
    }

    return {
      total_working_days: totalWorkingDays,
      days_present: daysPresent,
      days_absent: daysAbsent,
      days_on_leave: daysOnLeave,
      total_work_hours: Math.round(totalWorkHours * 10) / 10,
      total_overtime_hours: Math.round(totalOvertimeHours * 10) / 10,
      times_late: timesLate,
      total_late_minutes: totalLateMinutes,
      times_early_leave: timesEarlyLeave,
      total_early_leave_minutes: totalEarlyLeaveMinutes,
    };
  }

  /**
   * Map EmployeeShift entity to MyAttendanceShiftDto
   */
  private mapToDto(shift: any): MyAttendanceShiftDto {
    const props = shift.get_props();
    const shiftDate = new Date(props.shift_date);

    return {
      id: shift.id,
      shift_date: this.formatDate(shiftDate),
      day_of_week: this.getDayOfWeek(shiftDate),
      scheduled_start_time: props.scheduled_start_time,
      scheduled_end_time: props.scheduled_end_time,
      check_in_time: props.check_in_time
        ? props.check_in_time.toISOString()
        : undefined,
      check_out_time: props.check_out_time
        ? props.check_out_time.toISOString()
        : undefined,
      work_hours: props.work_hours ?? 0,
      overtime_hours: props.overtime_hours ?? 0,
      late_minutes: props.late_minutes ?? 0,
      early_leave_minutes: props.early_leave_minutes ?? 0,
      status: props.status ?? ShiftStatus.SCHEDULED,
      notes: props.notes,
    };
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get day of week name
   */
  private getDayOfWeek(date: Date): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  }
}
