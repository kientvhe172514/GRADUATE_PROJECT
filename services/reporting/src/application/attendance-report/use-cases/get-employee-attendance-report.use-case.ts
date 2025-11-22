import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  EmployeeAttendanceReportQueryDto,
  EmployeeAttendanceReportResponseDto,
  DailyAttendanceDetailDto,
  ReportPeriod,
} from '../dto/attendance-report.dto';

interface ShiftQueryResult {
  date: Date;
  day_of_week: string;
  shift_name: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  check_in_time: Date | null;
  check_out_time: Date | null;
  late_minutes: number;
  early_leave_minutes: number;
  work_hours: number;
  overtime_hours: number;
  status: string; // SCHEDULED, IN_PROGRESS, COMPLETED, ON_LEAVE, ABSENT
  shift_type: string; // REGULAR, OVERTIME
}

@Injectable()
export class GetEmployeeAttendanceReportUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('ATTENDANCE_SERVICE')
    private readonly attendanceService: ClientProxy,
    @Inject('LEAVE_SERVICE')
    private readonly leaveService: ClientProxy,
  ) {}

  async execute(
    query: EmployeeAttendanceReportQueryDto,
  ): Promise<EmployeeAttendanceReportResponseDto> {
    // 1. Calculate date range
    const { start_date, end_date } = this.calculateDateRange(query);

    // 2. Get employee information
    const employeeQuery = `
      SELECT 
        e.employee_id,
        e.employee_code,
        e.full_name,
        e.email,
        e.department_id,
        e.department_name,
        e.position_name,
        e.join_date
      FROM employees_cache e
      WHERE e.employee_id = $1
    `;

    const [employee] = await this.dataSource.query(employeeQuery, [query.employee_id]);

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${query.employee_id} not found`);
    }

    // 3. Get daily attendance records
    const dailyQuery = `
      SELECT 
        es.shift_date::date as date,
        TO_CHAR(es.shift_date, 'Day') as day_of_week,
        es.shift_name,
        es.scheduled_start_time,
        es.scheduled_end_time,
        es.check_in_time,
        es.check_out_time,
        es.late_minutes,
        es.early_leave_minutes,
        es.work_hours,
        es.overtime_hours,
        es.status,
        es.shift_type
      FROM employee_shifts_cache es
      WHERE es.employee_id = $1
        AND es.shift_date BETWEEN $2 AND $3
      ORDER BY es.shift_date
    `;

    const shifts: ShiftQueryResult[] = await this.dataSource.query(dailyQuery, [
      query.employee_id,
      start_date,
      end_date,
    ]);

    // 4. Get leave records for the period
    let leaveRecords: any[] = [];
    try {
      const leaveData = await firstValueFrom(
        this.leaveService.send(
          { cmd: 'get_employee_leaves_by_period' },
          {
            employee_id: query.employee_id,
            start_date,
            end_date,
          },
        ),
      );
      leaveRecords = leaveData || [];
    } catch (error) {
      console.warn('Failed to fetch leave data:', error);
    }

    // 5. Get holidays for the period
    let holidays: any[] = [];
    try {
      const holidayData = await this.dataSource.query(
        `
        SELECT holiday_date::date, holiday_name
        FROM holidays_cache
        WHERE holiday_date BETWEEN $1 AND $2
          AND status = 'ACTIVE'
        ORDER BY holiday_date
        `,
        [start_date, end_date],
      );
      holidays = holidayData || [];
    } catch (error) {
      console.warn('Failed to fetch holidays:', error);
    }

    // 6. Create leave map
    const leaveMap = new Map<string, any>();
    leaveRecords.forEach((leave) => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        leaveMap.set(dateKey, {
          leave_type: leave.leave_type_name || 'Leave',
          leave_days: Number(leave.total_leave_days) || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // 7. Create holiday map
    const holidayMap = new Map<string, string>();
    holidays.forEach((h) => {
      const dateKey = new Date(h.holiday_date).toISOString().split('T')[0];
      holidayMap.set(dateKey, h.holiday_name);
    });

    // 8. Build daily records
    const dailyRecords: DailyAttendanceDetailDto[] = [];
    const start = new Date(start_date);
    const end = new Date(end_date);
    const shiftMap = new Map<string, ShiftQueryResult>(
      shifts.map((s) => [s.date.toISOString().split('T')[0], s]),
    );

    let totalWorkingDays = 0;
    let totalWorkingHours = 0;
    let totalOvertimeHours = 0;
    let totalLateCount = 0;
    let totalEarlyLeaveCount = 0;
    let totalLeaveDays = 0;
    let totalAbsentDays = 0;
    let totalHolidays = 0;
    let totalManday = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const shift = shiftMap.get(dateKey);
      const leave = leaveMap.get(dateKey);
      const holidayName = holidayMap.get(dateKey);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      let checkInStatus = 'ABSENT';
      let checkOutStatus = 'ABSENT';
      let manday = 0;

      if (holidayName) {
        checkInStatus = 'HOLIDAY';
        checkOutStatus = 'HOLIDAY';
        totalHolidays++;
      } else if (leave) {
        checkInStatus = 'LEAVE';
        checkOutStatus = 'LEAVE';
        totalLeaveDays += leave.leave_days;
        manday = leave.leave_days; // Count leave as manday
      } else if (shift) {
        if (shift.status === 'COMPLETED') {
          checkInStatus = shift.late_minutes > 0 ? 'LATE' : 'ON_TIME';
          checkOutStatus = shift.early_leave_minutes > 0 ? 'EARLY' : 'ON_TIME';
          totalWorkingDays++;
          totalWorkingHours += Number(shift.work_hours) || 0;
          manday = 1; // Full working day

          if (shift.late_minutes > 0) totalLateCount++;
          if (shift.early_leave_minutes > 0) totalEarlyLeaveCount++;
        } else if (shift.status === 'ABSENT') {
          checkInStatus = 'ABSENT';
          checkOutStatus = 'ABSENT';
          totalAbsentDays++;
        } else if (shift.status === 'ON_LEAVE') {
          checkInStatus = 'LEAVE';
          checkOutStatus = 'LEAVE';
        }

        if (shift.overtime_hours > 0) {
          totalOvertimeHours += Number(shift.overtime_hours);
        }
      } else if (!isWeekend) {
        // Scheduled working day but no record
        totalAbsentDays++;
      }

      totalManday += manday;

      dailyRecords.push({
        date: dateKey,
        day_of_week: d.toLocaleDateString('en-US', { weekday: 'long' }),
        shift_name: shift?.shift_name,
        scheduled_start_time: shift?.scheduled_start_time,
        scheduled_end_time: shift?.scheduled_end_time,
        check_in_time: shift?.check_in_time
          ? new Date(shift.check_in_time).toISOString()
          : undefined,
        check_in_status: checkInStatus,
        late_minutes: shift && shift.late_minutes > 0 ? Number(shift.late_minutes) : undefined,
        check_out_time: shift?.check_out_time
          ? new Date(shift.check_out_time).toISOString()
          : undefined,
        check_out_status: checkOutStatus,
        early_leave_minutes:
          shift && shift.early_leave_minutes > 0 ? Number(shift.early_leave_minutes) : undefined,
        working_hours: Number(shift?.work_hours) || 0,
        outside_office_time: undefined, // TODO: Implement GPS tracking analysis
        leave_type: leave?.leave_type,
        leave_days: leave?.leave_days,
        is_holiday: !!holidayName,
        holiday_name: holidayName,
        overtime_hours: shift && shift.overtime_hours > 0 ? Number(shift.overtime_hours) : undefined,
        overtime_status: shift?.shift_type === 'OVERTIME' ? 'APPROVED' : undefined,
        manday: manday,
        remarks: shift?.status,
      });
    }

    // 9. Calculate total days in period
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 10. Calculate attendance rate
    const expectedWorkingDays = totalDays - totalHolidays - totalLeaveDays;
    const attendanceRate =
      expectedWorkingDays > 0
        ? Number(((totalWorkingDays / expectedWorkingDays) * 100).toFixed(2))
        : 0;

    return {
      employee: {
        employee_id: employee.employee_id,
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        email: employee.email,
        department_id: employee.department_id,
        department_name: employee.department_name,
        position_name: employee.position_name,
        join_date: employee.join_date,
      },
      period: {
        type: query.period || ReportPeriod.MONTH,
        start_date,
        end_date,
        total_days: totalDays,
      },
      summary: {
        total_working_days: totalWorkingDays,
        total_working_hours: Number(totalWorkingHours.toFixed(2)),
        total_overtime_hours: Number(totalOvertimeHours.toFixed(2)),
        total_late_count: totalLateCount,
        total_early_leave_count: totalEarlyLeaveCount,
        total_leave_days: Number(totalLeaveDays.toFixed(2)),
        total_absent_days: totalAbsentDays,
        total_holidays: totalHolidays,
        total_manday: Number(totalManday.toFixed(2)),
        attendance_rate: attendanceRate,
      },
      daily_records: dailyRecords,
    };
  }

  private calculateDateRange(query: EmployeeAttendanceReportQueryDto): {
    start_date: string;
    end_date: string;
  } {
    if (query.start_date && query.end_date) {
      return {
        start_date: query.start_date,
        end_date: query.end_date,
      };
    }

    const now = new Date();
    let start: Date;
    let end: Date;

    switch (query.period) {
      case ReportPeriod.DAY:
        start = new Date(now);
        end = new Date(now);
        break;

      case ReportPeriod.WEEK:
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;

      case ReportPeriod.MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;

      case ReportPeriod.QUARTER:
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;

      case ReportPeriod.YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;

      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  }
}
