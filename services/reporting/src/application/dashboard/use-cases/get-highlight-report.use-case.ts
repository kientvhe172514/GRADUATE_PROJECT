import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  HighlightReportQueryDto,
  HighlightReportResponseDto,
  HighlightKPIDto,
  TopEmployeeDto,
  UnusualAbsenceEmployeeDto,
  HighlightCategory,
  HighlightPeriod,
} from '../dto/highlight-report.dto';

@Injectable()
export class GetHighlightReportUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('ATTENDANCE_SERVICE')
    private readonly attendanceClient: ClientProxy,
    @Inject('LEAVE_SERVICE')
    private readonly leaveClient: ClientProxy,
  ) {}

  async execute(query: HighlightReportQueryDto): Promise<HighlightReportResponseDto> {
    const { start_date, end_date, label } = this.calculatePeriodDates(
      query.period || HighlightPeriod.MONTH, 
      query.start_date, 
      query.end_date
    );

    const departmentFilter = query.department_id ? `AND es.department_id = ${query.department_id}` : '';

    // Get department info if filtered
    let departmentInfo: any = null;
    if (query.department_id) {
      departmentInfo = await this.getDepartmentInfo(query.department_id);
    }

    // Calculate all KPIs in parallel
    const [
      topLate,
      topEarly,
      topLeave,
      topOT,
      unusualAbsences,
      overallStats,
      previousPeriodStats,
    ] = await Promise.all([
      this.getTopLateEmployees(start_date, end_date, departmentFilter, 1),
      this.getTopEarlyLeaveEmployees(start_date, end_date, departmentFilter, 1),
      this.getTopLeaveEmployees(start_date, end_date, departmentFilter, 1),
      this.getTopOvertimeEmployees(start_date, end_date, departmentFilter, 1),
      this.getUnusualAbsences(start_date, end_date, departmentFilter),
      this.getOverallStats(start_date, end_date, departmentFilter),
      this.getPreviousPeriodStats(query.period || HighlightPeriod.MONTH, start_date, end_date, departmentFilter),
    ]);

    // Build KPI cards with trends
    const kpi_cards: HighlightKPIDto[] = [
      {
        title: 'Top Most Late',
        icon: '🔴',
        value: topLate.total_count || 0,
        unit: 'times',
        top_employee: topLate.employees[0] || null,
        trend: this.calculateTrend(topLate.total_count, previousPeriodStats.total_late),
        category: HighlightCategory.LATE,
      },
      {
        title: 'Top Most Early Leave',
        icon: '🟠',
        value: topEarly.total_count || 0,
        unit: 'times',
        top_employee: topEarly.employees[0] || null,
        trend: this.calculateTrend(topEarly.total_count, previousPeriodStats.total_early),
        category: HighlightCategory.EARLY,
      },
      {
        title: 'Top Most Leave',
        icon: '🟡',
        value: topLeave.total_count || 0,
        unit: 'days',
        top_employee: topLeave.employees[0] || null,
        trend: this.calculateTrend(topLeave.total_count, previousPeriodStats.total_leave),
        category: HighlightCategory.LEAVE,
      },
      {
        title: 'Top Most Overtime',
        icon: '🟢',
        value: topOT.total_count || 0,
        unit: 'hours',
        top_employee: topOT.employees[0] || null,
        trend: this.calculateTrend(topOT.total_count, previousPeriodStats.total_ot),
        category: HighlightCategory.OVERTIME,
      },
    ];

    return {
      period: {
        type: query.period || HighlightPeriod.MONTH,
        start_date,
        end_date,
        label,
      },
      department: departmentInfo ? {
        department_id: departmentInfo.id,
        department_name: departmentInfo.name,
      } : undefined,
      kpi_cards,
      unusual_absences: unusualAbsences,
      overall_stats: overallStats,
    };
  }

  private calculatePeriodDates(
    period: HighlightPeriod,
    customStart?: string,
    customEnd?: string,
  ): { start_date: string; end_date: string; label: string } {
    const now = new Date();
    let start_date: Date;
    let end_date: Date;
    let label: string;

    if (customStart && customEnd) {
      start_date = new Date(customStart);
      end_date = new Date(customEnd);
      label = `${customStart} to ${customEnd}`;
    } else if (period === HighlightPeriod.MONTH) {
      start_date = new Date(now.getFullYear(), now.getMonth(), 1);
      end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      label = start_date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (period === HighlightPeriod.QUARTER) {
      const quarter = Math.floor(now.getMonth() / 3);
      start_date = new Date(now.getFullYear(), quarter * 3, 1);
      end_date = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      label = `Q${quarter + 1} ${now.getFullYear()}`;
    } else {
      // YEAR
      start_date = new Date(now.getFullYear(), 0, 1);
      end_date = new Date(now.getFullYear(), 11, 31);
      label = now.getFullYear().toString();
    }

    return {
      start_date: start_date.toISOString().split('T')[0],
      end_date: end_date.toISOString().split('T')[0],
      label,
    };
  }

  private async getDepartmentInfo(departmentId: number): Promise<any> {
    // Call Employee Service to get department info
    try {
      const result = await firstValueFrom(
        this.attendanceClient.send('department.get', { department_id: departmentId }),
      );
      return result?.data || null;
    } catch {
      return null;
    }
  }

  private async getTopLateEmployees(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    limit: number,
  ): Promise<{ employees: TopEmployeeDto[]; total_count: number }> {
    const query = `
      SELECT 
        es.employee_id,
        es.employee_code,
        e.full_name,
        e.department_name,
        e.position_name,
        e.avatar_url,
        COUNT(*) as late_count,
        SUM(es.late_minutes) as total_late_minutes,
        ROUND(COUNT(*)::numeric * 100 / NULLIF(COUNT(*) OVER (PARTITION BY es.employee_id), 0), 2) as late_rate
      FROM employee_shifts es
      LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.late_minutes > 0
        ${departmentFilter}
      GROUP BY es.employee_id, es.employee_code, e.full_name, e.department_name, e.position_name, e.avatar_url
      ORDER BY late_count DESC, total_late_minutes DESC
      LIMIT $3
    `;

    const employees = await this.dataSource.query(query, [startDate, endDate, limit]);

    const totalQuery = `
      SELECT COUNT(*) as total_count
      FROM employee_shifts es
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.late_minutes > 0
        ${departmentFilter}
    `;

    const totalResult = await this.dataSource.query(totalQuery, [startDate, endDate]);

    return {
      employees: employees.map((e: any) => ({
        employee_id: e.employee_id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        department_name: e.department_name,
        position_name: e.position_name,
        avatar_url: e.avatar_url,
        count: parseInt(e.late_count, 10),
        metric_value: parseFloat(e.total_late_minutes),
        rate: parseFloat(e.late_rate),
      })),
      total_count: parseInt(totalResult[0]?.total_count || '0', 10),
    };
  }

  private async getTopEarlyLeaveEmployees(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    limit: number,
  ): Promise<{ employees: TopEmployeeDto[]; total_count: number }> {
    const query = `
      SELECT 
        es.employee_id,
        es.employee_code,
        e.full_name,
        e.department_name,
        e.position_name,
        e.avatar_url,
        COUNT(*) as early_count,
        SUM(es.early_leave_minutes) as total_early_minutes,
        ROUND(COUNT(*)::numeric * 100 / NULLIF(COUNT(*) OVER (PARTITION BY es.employee_id), 0), 2) as early_rate
      FROM employee_shifts es
      LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.early_leave_minutes > 0
        ${departmentFilter}
      GROUP BY es.employee_id, es.employee_code, e.full_name, e.department_name, e.position_name, e.avatar_url
      ORDER BY early_count DESC, total_early_minutes DESC
      LIMIT $3
    `;

    const employees = await this.dataSource.query(query, [startDate, endDate, limit]);

    const totalQuery = `
      SELECT COUNT(*) as total_count
      FROM employee_shifts es
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.early_leave_minutes > 0
        ${departmentFilter}
    `;

    const totalResult = await this.dataSource.query(totalQuery, [startDate, endDate]);

    return {
      employees: employees.map((e: any) => ({
        employee_id: e.employee_id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        department_name: e.department_name,
        position_name: e.position_name,
        avatar_url: e.avatar_url,
        count: parseInt(e.early_count, 10),
        metric_value: parseFloat(e.total_early_minutes),
        rate: parseFloat(e.early_rate),
      })),
      total_count: parseInt(totalResult[0]?.total_count || '0', 10),
    };
  }

  private async getTopLeaveEmployees(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    limit: number,
  ): Promise<{ employees: TopEmployeeDto[]; total_count: number }> {
    const query = `
      SELECT 
        te.employee_id,
        e.employee_code,
        e.full_name,
        e.department_name,
        e.position_name,
        e.avatar_url,
        SUM(te.leave_days) as total_leave_days,
        COUNT(DISTINCT te.leave_request_id) as leave_request_count
      FROM timesheet_entries te
      LEFT JOIN employee_cache e ON e.employee_id = te.employee_id
      WHERE te.entry_date BETWEEN $1 AND $2
        AND te.leave_days > 0
        ${departmentFilter.replace('es.', 'te.')}
      GROUP BY te.employee_id, e.employee_code, e.full_name, e.department_name, e.position_name, e.avatar_url
      ORDER BY total_leave_days DESC
      LIMIT $3
    `;

    const employees = await this.dataSource.query(query, [startDate, endDate, limit]);

    const totalQuery = `
      SELECT SUM(te.leave_days) as total_count
      FROM timesheet_entries te
      WHERE te.entry_date BETWEEN $1 AND $2
        AND te.leave_days > 0
        ${departmentFilter.replace('es.', 'te.')}
    `;

    const totalResult = await this.dataSource.query(totalQuery, [startDate, endDate]);

    return {
      employees: employees.map((e: any) => ({
        employee_id: e.employee_id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        department_name: e.department_name,
        position_name: e.position_name,
        avatar_url: e.avatar_url,
        count: parseFloat(e.total_leave_days),
        metric_value: parseInt(e.leave_request_count, 10),
        rate: null,
      })),
      total_count: parseFloat(totalResult[0]?.total_count || '0'),
    };
  }

  private async getTopOvertimeEmployees(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    limit: number,
  ): Promise<{ employees: TopEmployeeDto[]; total_count: number }> {
    const query = `
      SELECT 
        es.employee_id,
        es.employee_code,
        e.full_name,
        e.department_name,
        e.position_name,
        e.avatar_url,
        SUM(es.overtime_hours) as total_ot_hours,
        COUNT(*) as ot_shift_count,
        ROUND(SUM(es.overtime_hours) / NULLIF(COUNT(*), 0), 2) as avg_ot_per_shift
      FROM employee_shifts es
      LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.shift_type = 'OVERTIME'
        AND es.overtime_hours > 0
        ${departmentFilter}
      GROUP BY es.employee_id, es.employee_code, e.full_name, e.department_name, e.position_name, e.avatar_url
      ORDER BY total_ot_hours DESC
      LIMIT $3
    `;

    const employees = await this.dataSource.query(query, [startDate, endDate, limit]);

    const totalQuery = `
      SELECT SUM(es.overtime_hours) as total_count
      FROM employee_shifts es
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.shift_type = 'OVERTIME'
        AND es.overtime_hours > 0
        ${departmentFilter}
    `;

    const totalResult = await this.dataSource.query(totalQuery, [startDate, endDate]);

    return {
      employees: employees.map((e: any) => ({
        employee_id: e.employee_id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        department_name: e.department_name,
        position_name: e.position_name,
        avatar_url: e.avatar_url,
        count: parseFloat(e.total_ot_hours),
        metric_value: parseFloat(e.avg_ot_per_shift),
        rate: null,
      })),
      total_count: parseFloat(totalResult[0]?.total_count || '0'),
    };
  }

  private async getUnusualAbsences(
    startDate: string,
    endDate: string,
    departmentFilter: string,
  ): Promise<UnusualAbsenceEmployeeDto[]> {
    // Define "unusual" as: 3+ consecutive absences OR 5+ total absences in period
    const query = `
      WITH absence_data AS (
        SELECT 
          es.employee_id,
          es.employee_code,
          e.full_name,
          e.department_name,
          e.position_name,
          e.avatar_url,
          es.shift_date,
          CASE 
            WHEN es.status = 'ABSENT' AND te.leave_days = 0 THEN 1
            ELSE 0
          END as is_unusual_absence
        FROM employee_shifts es
        LEFT JOIN timesheet_entries te ON te.employee_id = es.employee_id AND te.entry_date = es.shift_date
        LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
        WHERE es.shift_date BETWEEN $1 AND $2
          ${departmentFilter}
      ),
      employee_absences AS (
        SELECT 
          employee_id,
          employee_code,
          full_name,
          department_name,
          position_name,
          avatar_url,
          SUM(is_unusual_absence) as unusual_absence_count,
          SUM(is_unusual_absence) as absent_days,
          MAX(CASE WHEN is_unusual_absence = 1 THEN shift_date END) as last_absence_date
        FROM absence_data
        GROUP BY employee_id, employee_code, full_name, department_name, position_name, avatar_url
        HAVING SUM(is_unusual_absence) >= 3
      ),
      total_working_days AS (
        SELECT COUNT(DISTINCT shift_date) as total_days
        FROM employee_shifts
        WHERE shift_date BETWEEN $1 AND $2
      )
      SELECT 
        ea.*,
        ROUND(100 - (ea.absent_days::numeric * 100 / NULLIF(twd.total_days, 0)), 2) as attendance_rate
      FROM employee_absences ea
      CROSS JOIN total_working_days twd
      ORDER BY ea.unusual_absence_count DESC, ea.last_absence_date DESC
      LIMIT 10
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);

    return result.map((e: any) => ({
      employee_id: e.employee_id,
      employee_code: e.employee_code,
      full_name: e.full_name,
      department_name: e.department_name,
      position_name: e.position_name,
      avatar_url: e.avatar_url,
      unusual_absence_count: parseInt(e.unusual_absence_count, 10),
      absent_days: parseInt(e.absent_days, 10),
      attendance_rate: parseFloat(e.attendance_rate),
      last_absence_date: e.last_absence_date,
      consecutive_absence_days: null, // Can be enhanced with window functions
    }));
  }

  private async getOverallStats(
    startDate: string,
    endDate: string,
    departmentFilter: string,
  ): Promise<{ total_employees: number; total_working_days: number; average_attendance_rate: number }> {
    const query = `
      WITH employee_stats AS (
        SELECT 
          COUNT(DISTINCT es.employee_id) as total_employees,
          COUNT(DISTINCT es.shift_date) as total_working_days,
          COUNT(*) as total_shifts,
          SUM(CASE WHEN es.status IN ('COMPLETED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as attended_shifts
        FROM employee_shifts es
        WHERE es.shift_date BETWEEN $1 AND $2
          ${departmentFilter}
      )
      SELECT 
        total_employees,
        total_working_days,
        ROUND(attended_shifts::numeric * 100 / NULLIF(total_shifts, 0), 2) as average_attendance_rate
      FROM employee_stats
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);
    const row = result[0] || { total_employees: 0, total_working_days: 0, average_attendance_rate: 0 };

    return {
      total_employees: parseInt(row.total_employees, 10),
      total_working_days: parseInt(row.total_working_days, 10),
      average_attendance_rate: parseFloat(row.average_attendance_rate),
    };
  }

  private async getPreviousPeriodStats(
    period: HighlightPeriod,
    currentStart: string,
    currentEnd: string,
    departmentFilter: string,
  ): Promise<{ total_late: number; total_early: number; total_leave: number; total_ot: number }> {
    const currentStartDate = new Date(currentStart);
    const currentEndDate = new Date(currentEnd);
    const periodDays = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));

    const prevEndDate = new Date(currentStartDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays + 1);

    const query = `
      SELECT 
        COUNT(CASE WHEN es.late_minutes > 0 THEN 1 END) as total_late,
        COUNT(CASE WHEN es.early_leave_minutes > 0 THEN 1 END) as total_early,
        COALESCE(SUM(te.leave_days), 0) as total_leave,
        COALESCE(SUM(es.overtime_hours), 0) as total_ot
      FROM employee_shifts es
      LEFT JOIN timesheet_entries te ON te.employee_id = es.employee_id AND te.entry_date = es.shift_date
      WHERE es.shift_date BETWEEN $1 AND $2
        ${departmentFilter}
    `;

    const result = await this.dataSource.query(query, [
      prevStartDate.toISOString().split('T')[0],
      prevEndDate.toISOString().split('T')[0],
    ]);

    const row = result[0] || { total_late: 0, total_early: 0, total_leave: 0, total_ot: 0 };

    return {
      total_late: parseInt(row.total_late, 10),
      total_early: parseInt(row.total_early, 10),
      total_leave: parseFloat(row.total_leave),
      total_ot: parseFloat(row.total_ot),
    };
  }

  private calculateTrend(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return Math.round(((currentValue - previousValue) / previousValue) * 100);
  }
}
