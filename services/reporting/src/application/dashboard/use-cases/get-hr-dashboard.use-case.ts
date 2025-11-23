import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { JwtPayload } from '@graduate-project/shared-common';
import {
  HRDashboardQueryDto,
  HRDashboardResponseDto,
  KPICardDto,
  StatusDistributionDto,
  LeaveTypeDistributionDto,
  WorkingHoursTrendDto,
  DepartmentComparisonDto,
  CalendarDayDto,
  ResourceAllocationDto,
  DashboardPeriod,
} from '../dto/hr-dashboard.dto';

@Injectable()
export class GetHRDashboardUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('ATTENDANCE_SERVICE')
    private readonly attendanceClient: ClientProxy,
    @Inject('LEAVE_SERVICE')
    private readonly leaveClient: ClientProxy,
  ) {}

  async execute(query: HRDashboardQueryDto, currentUser: JwtPayload): Promise<HRDashboardResponseDto> {
    // Determine department filter based on user role
    const isDepartmentManager = currentUser.role === 'DEPARTMENT_MANAGER';
    
    // For department managers, filter by their department (get from employee_cache)
    // For HR/Admin, show all departments or specific department if requested
    let departmentFilter: number | undefined;
    
    if (isDepartmentManager && currentUser.employee_id) {
      // Get department_id from employee_cache
      const employeeQuery = `
        SELECT department_id 
        FROM employee_cache 
        WHERE employee_id = $1
      `;
      const employeeResult = await this.dataSource.query(employeeQuery, [currentUser.employee_id]);
      departmentFilter = employeeResult[0]?.department_id;
    } else if (query.department_id) {
      // HR/Admin can filter by specific department
      departmentFilter = query.department_id;
    }

    const { start_date, end_date, label } = this.calculatePeriodDates(
      query.period || DashboardPeriod.MONTH,
      query.start_date,
      query.end_date,
    );

    const departmentCondition = departmentFilter ? `AND es.department_id = ${departmentFilter}` : '';

    // Fetch all dashboard data in parallel
    const [
      kpiCards,
      statusDistribution,
      leaveDistribution,
      workingHoursTrend,
      departmentComparison,
      calendarHeatmap,
      resourceAllocation,
    ] = await Promise.all([
      this.getKPICards(start_date, end_date, departmentCondition),
      this.getStatusDistribution(start_date, end_date, departmentCondition),
      this.getLeaveDistribution(start_date, end_date, departmentCondition),
      this.getWorkingHoursTrend(start_date, end_date, query.period || DashboardPeriod.MONTH, departmentCondition),
      isDepartmentManager ? [] : this.getDepartmentComparison(start_date, end_date),
      this.getCalendarHeatmap(start_date, end_date, departmentCondition),
      this.getResourceAllocation(start_date, end_date, departmentCondition),
    ]);

    return {
      period: {
        type: query.period || DashboardPeriod.MONTH,
        start_date,
        end_date,
        label,
      },
      kpi_cards: kpiCards,
      charts: {
        status_distribution: statusDistribution,
        leave_distribution: leaveDistribution,
        working_hours_trend: workingHoursTrend,
        department_comparison: departmentComparison,
      },
      calendar_heatmap: calendarHeatmap,
      resource_allocation: resourceAllocation,
    };
  }

  private calculatePeriodDates(
    period: DashboardPeriod,
    customStart?: string,
    customEnd?: string,
  ): { start_date: string; end_date: string; label: string } {
    const now = new Date();
    let start_date: Date;
    let end_date: Date = new Date();
    let label: string;

    if (customStart && customEnd) {
      start_date = new Date(customStart);
      end_date = new Date(customEnd);
      label = `${customStart} to ${customEnd}`;
    } else if (period === DashboardPeriod.DAY) {
      start_date = new Date(now);
      end_date = new Date(now);
      label = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (period === DashboardPeriod.WEEK) {
      const dayOfWeek = now.getDay();
      start_date = new Date(now);
      start_date.setDate(now.getDate() - dayOfWeek);
      end_date = new Date(start_date);
      end_date.setDate(start_date.getDate() + 6);
      label = `Week of ${start_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (period === DashboardPeriod.MONTH) {
      start_date = new Date(now.getFullYear(), now.getMonth(), 1);
      end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      label = start_date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (period === DashboardPeriod.QUARTER) {
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

  private async getKPICards(
    startDate: string,
    endDate: string,
    departmentCondition: string,
  ): Promise<KPICardDto[]> {
    const query = `
      SELECT 
        COUNT(DISTINCT es.employee_id) as total_employees,
        COALESCE(SUM(es.work_hours), 0) as total_working_hours,
        COALESCE(SUM(es.overtime_hours), 0) as total_ot_hours,
        COALESCE(SUM(te.leave_days), 0) as total_leave_days,
        COUNT(*) FILTER (WHERE es.status IN ('COMPLETED', 'IN_PROGRESS')) as on_time_count,
        COUNT(*) as total_shifts,
        ROUND(
          COUNT(*) FILTER (WHERE es.status IN ('COMPLETED', 'IN_PROGRESS'))::numeric * 100 / 
          NULLIF(COUNT(*), 0), 
          2
        ) as on_time_rate
      FROM employee_shifts es
      LEFT JOIN timesheet_entries te ON te.employee_id = es.employee_id AND te.entry_date = es.shift_date
      WHERE es.shift_date BETWEEN $1 AND $2
        ${departmentCondition}
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);
    const data = result[0] || {};

    // Get previous period for trends
    const prevPeriod = await this.getPreviousPeriodKPIs(startDate, endDate, departmentCondition);

    return [
      {
        title: 'Total Employees',
        value: parseInt(data.total_employees || 0, 10),
        unit: 'employees',
        icon: '👥',
        trend: this.calculateTrend(parseInt(data.total_employees || 0, 10), prevPeriod.total_employees),
        trend_direction: this.getTrendDirection(parseInt(data.total_employees || 0, 10), prevPeriod.total_employees),
        color: 'info',
      },
      {
        title: 'Total Working Hours',
        value: parseFloat(data.total_working_hours || 0),
        unit: 'hours',
        icon: '⏰',
        trend: this.calculateTrend(parseFloat(data.total_working_hours || 0), prevPeriod.total_working_hours),
        trend_direction: this.getTrendDirection(parseFloat(data.total_working_hours || 0), prevPeriod.total_working_hours),
        color: 'success',
      },
      {
        title: 'Total Overtime',
        value: parseFloat(data.total_ot_hours || 0),
        unit: 'hours',
        icon: '🌙',
        trend: this.calculateTrend(parseFloat(data.total_ot_hours || 0), prevPeriod.total_ot_hours),
        trend_direction: this.getTrendDirection(parseFloat(data.total_ot_hours || 0), prevPeriod.total_ot_hours),
        color: 'warning',
      },
      {
        title: 'Total Leave Days',
        value: parseFloat(data.total_leave_days || 0),
        unit: 'days',
        icon: '🏖️',
        trend: this.calculateTrend(parseFloat(data.total_leave_days || 0), prevPeriod.total_leave_days),
        trend_direction: this.getTrendDirection(parseFloat(data.total_leave_days || 0), prevPeriod.total_leave_days),
        color: 'info',
      },
      {
        title: 'On-Time Rate',
        value: parseFloat(data.on_time_rate || 0),
        unit: '%',
        icon: '✅',
        trend: this.calculateTrend(parseFloat(data.on_time_rate || 0), prevPeriod.on_time_rate),
        trend_direction: this.getTrendDirection(parseFloat(data.on_time_rate || 0), prevPeriod.on_time_rate),
        color: 'success',
      },
    ];
  }

  private async getPreviousPeriodKPIs(
    currentStart: string,
    currentEnd: string,
    departmentCondition: string,
  ): Promise<any> {
    const currentStartDate = new Date(currentStart);
    const currentEndDate = new Date(currentEnd);
    const periodDays = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));

    const prevEndDate = new Date(currentStartDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays + 1);

    const query = `
      SELECT 
        COUNT(DISTINCT es.employee_id) as total_employees,
        COALESCE(SUM(es.work_hours), 0) as total_working_hours,
        COALESCE(SUM(es.overtime_hours), 0) as total_ot_hours,
        COALESCE(SUM(te.leave_days), 0) as total_leave_days,
        ROUND(
          COUNT(*) FILTER (WHERE es.status IN ('COMPLETED', 'IN_PROGRESS'))::numeric * 100 / 
          NULLIF(COUNT(*), 0), 
          2
        ) as on_time_rate
      FROM employee_shifts es
      LEFT JOIN timesheet_entries te ON te.employee_id = es.employee_id AND te.entry_date = es.shift_date
      WHERE es.shift_date BETWEEN $1 AND $2
        ${departmentCondition}
    `;

    const result = await this.dataSource.query(query, [
      prevStartDate.toISOString().split('T')[0],
      prevEndDate.toISOString().split('T')[0],
    ]);

    const data = result[0] || {};
    return {
      total_employees: parseInt(data.total_employees || 0, 10),
      total_working_hours: parseFloat(data.total_working_hours || 0),
      total_ot_hours: parseFloat(data.total_ot_hours || 0),
      total_leave_days: parseFloat(data.total_leave_days || 0),
      on_time_rate: parseFloat(data.on_time_rate || 0),
    };
  }

  private async getStatusDistribution(
    startDate: string,
    endDate: string,
    departmentCondition: string,
  ): Promise<StatusDistributionDto[]> {
    const query = `
      SELECT 
        CASE 
          WHEN es.status = 'COMPLETED' AND es.late_minutes = 0 AND es.early_leave_minutes = 0 THEN 'On-Time'
          WHEN es.late_minutes > 0 OR es.early_leave_minutes > 0 THEN 'Late/Early'
          WHEN te.leave_days > 0 THEN 'Leave'
          WHEN es.status = 'ABSENT' THEN 'Absent'
          ELSE 'Other'
        END as status,
        COUNT(*) as count
      FROM employee_shifts es
      LEFT JOIN timesheet_entries te ON te.employee_id = es.employee_id AND te.entry_date = es.shift_date
      WHERE es.shift_date BETWEEN $1 AND $2
        ${departmentCondition}
      GROUP BY status
      ORDER BY count DESC
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);
    const total = result.reduce((sum: number, row: any) => sum + parseInt(row.count, 10), 0);

    const colorMap: { [key: string]: string } = {
      'On-Time': '#10b981',
      'Late/Early': '#f59e0b',
      'Leave': '#3b82f6',
      'Absent': '#ef4444',
      'Other': '#6b7280',
    };

    return result.map((row: any) => ({
      status: row.status,
      count: parseInt(row.count, 10),
      percentage: Math.round((parseInt(row.count, 10) / total) * 100),
      color: colorMap[row.status] || '#6b7280',
    }));
  }

  private async getLeaveDistribution(
    startDate: string,
    endDate: string,
    departmentCondition: string,
  ): Promise<LeaveTypeDistributionDto[]> {
    const query = `
      SELECT 
        te.leave_type,
        SUM(te.leave_days) as total_days
      FROM timesheet_entries te
      WHERE te.entry_date BETWEEN $1 AND $2
        AND te.leave_days > 0
        ${departmentCondition.replace('es.', 'te.')}
      GROUP BY te.leave_type
      ORDER BY total_days DESC
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);
    const total = result.reduce((sum: number, row: any) => sum + parseFloat(row.total_days), 0);

    const colorMap: { [key: string]: string } = {
      'ANNUAL': '#3b82f6',
      'SICK': '#ef4444',
      'UNPAID': '#6b7280',
      'MATERNITY': '#ec4899',
      'PATERNITY': '#8b5cf6',
      'BEREAVEMENT': '#64748b',
      'OTHER': '#94a3b8',
    };

    return result.map((row: any) => ({
      leave_type: row.leave_type || 'OTHER',
      days: parseFloat(row.total_days),
      percentage: Math.round((parseFloat(row.total_days) / total) * 100),
      color: colorMap[row.leave_type] || '#94a3b8',
    }));
  }

  private async getWorkingHoursTrend(
    startDate: string,
    endDate: string,
    period: DashboardPeriod,
    departmentCondition: string,
  ): Promise<WorkingHoursTrendDto[]> {
    let groupByClause = '';
    let periodLabel = '';

    if (period === DashboardPeriod.MONTH || period === DashboardPeriod.QUARTER || period === DashboardPeriod.YEAR) {
      groupByClause = "TO_CHAR(es.shift_date, 'IYYY-IW')";
      periodLabel = "TO_CHAR(es.shift_date, 'IYYY-IW')";
    } else {
      groupByClause = 'es.shift_date';
      periodLabel = "TO_CHAR(es.shift_date, 'YYYY-MM-DD')";
    }

    const query = `
      SELECT 
        ${periodLabel} as period_label,
        MIN(es.shift_date) as start_date,
        MAX(es.shift_date) as end_date,
        ROUND(AVG(es.work_hours), 2) as average_hours,
        SUM(es.work_hours) as total_hours
      FROM employee_shifts es
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.work_hours > 0
        ${departmentCondition}
      GROUP BY ${groupByClause}
      ORDER BY start_date ASC
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);

    return result.map((row: any) => ({
      period_label: row.period_label,
      average_hours: parseFloat(row.average_hours),
      total_hours: parseFloat(row.total_hours),
      start_date: row.start_date,
      end_date: row.end_date,
    }));
  }

  private async getDepartmentComparison(
    startDate: string,
    endDate: string,
  ): Promise<DepartmentComparisonDto[]> {
    const query = `
      SELECT 
        es.department_id,
        e.department_name,
        COUNT(DISTINCT es.employee_id) as total_employees,
        COUNT(*) FILTER (WHERE es.late_minutes > 0) as late_count,
        COALESCE(SUM(te.leave_days), 0) as leave_days,
        COUNT(*) FILTER (WHERE es.status = 'ABSENT') as absent_days,
        ROUND(
          COUNT(*) FILTER (WHERE es.status IN ('COMPLETED', 'IN_PROGRESS'))::numeric * 100 / 
          NULLIF(COUNT(*), 0), 
          2
        ) as attendance_rate
      FROM employee_shifts es
      LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
      LEFT JOIN timesheet_entries te ON te.employee_id = es.employee_id AND te.entry_date = es.shift_date
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.department_id IS NOT NULL
      GROUP BY es.department_id, e.department_name
      ORDER BY total_employees DESC
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);

    return result.map((row: any) => ({
      department_id: row.department_id,
      department_name: row.department_name || `Department ${row.department_id}`,
      late_count: parseInt(row.late_count, 10),
      leave_days: parseFloat(row.leave_days),
      absent_days: parseInt(row.absent_days, 10),
      total_employees: parseInt(row.total_employees, 10),
      attendance_rate: parseFloat(row.attendance_rate),
    }));
  }

  private async getCalendarHeatmap(
    startDate: string,
    endDate: string,
    departmentCondition: string,
  ): Promise<CalendarDayDto[]> {
    const query = `
      SELECT 
        es.shift_date as date,
        TO_CHAR(es.shift_date, 'Day') as day_of_week,
        COUNT(DISTINCT es.employee_id) as total_scheduled,
        COUNT(*) FILTER (WHERE es.status IN ('COMPLETED', 'IN_PROGRESS') AND es.late_minutes = 0) as on_time_count,
        COUNT(*) FILTER (WHERE es.late_minutes > 0) as late_count,
        COUNT(*) FILTER (WHERE te.leave_days > 0) as leave_count,
        COUNT(*) FILTER (WHERE es.status = 'ABSENT') as absent_count,
        ROUND(
          COUNT(*) FILTER (WHERE es.status IN ('COMPLETED', 'IN_PROGRESS') AND es.late_minutes = 0)::numeric * 100 / 
          NULLIF(COUNT(DISTINCT es.employee_id), 0), 
          2
        ) as on_time_rate
      FROM employee_shifts es
      LEFT JOIN timesheet_entries te ON te.employee_id = es.employee_id AND te.entry_date = es.shift_date
      WHERE es.shift_date BETWEEN $1 AND $2
        ${departmentCondition}
      GROUP BY es.shift_date
      ORDER BY es.shift_date ASC
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);

    return result.map((row: any) => {
      const onTimeRate = parseFloat(row.on_time_rate || 0);
      const lateCount = parseInt(row.late_count, 10);
      const leaveCount = parseInt(row.leave_count, 10);
      const absentCount = parseInt(row.absent_count, 10);

      let status: 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT' | 'HOLIDAY' | 'WEEKEND' = 'ON_TIME';
      let color = '#10b981';

      if (absentCount > lateCount && absentCount > leaveCount) {
        status = 'ABSENT';
        color = '#ef4444';
      } else if (leaveCount > lateCount) {
        status = 'LEAVE';
        color = '#3b82f6';
      } else if (lateCount > 0) {
        status = 'LATE';
        color = '#f59e0b';
      } else if (onTimeRate >= 90) {
        status = 'ON_TIME';
        color = '#10b981';
      }

      return {
        date: row.date,
        day_of_week: row.day_of_week.trim(),
        status,
        color,
        on_time_rate: onTimeRate,
        total_scheduled: parseInt(row.total_scheduled, 10),
        summary: `${onTimeRate}% on-time (${row.total_scheduled} employees)`,
      };
    });
  }

  private async getResourceAllocation(
    startDate: string,
    endDate: string,
    departmentCondition: string,
  ): Promise<ResourceAllocationDto[]> {
    const today = new Date().toISOString().split('T')[0];

    const query = `
      SELECT 
        es.department_id,
        e.department_name,
        COUNT(DISTINCT es.employee_id) as total_employees,
        COUNT(DISTINCT es.employee_id) FILTER (WHERE es.shift_date = $3 AND es.status IN ('COMPLETED', 'IN_PROGRESS')) as present,
        COUNT(DISTINCT te.employee_id) FILTER (WHERE te.entry_date = $3 AND te.leave_days > 0) as on_leave,
        COUNT(DISTINCT es.employee_id) FILTER (WHERE es.shift_date = $3 AND es.status = 'ABSENT') as absent,
        ROUND(
          COUNT(DISTINCT es.employee_id) FILTER (WHERE es.shift_date = $3 AND es.status IN ('COMPLETED', 'IN_PROGRESS'))::numeric * 100 / 
          NULLIF(COUNT(DISTINCT es.employee_id), 0), 
          2
        ) as availability_rate
      FROM employee_shifts es
      LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
      LEFT JOIN timesheet_entries te ON te.employee_id = es.employee_id AND te.entry_date = es.shift_date
      WHERE es.shift_date BETWEEN $1 AND $2
        ${departmentCondition}
        AND es.department_id IS NOT NULL
      GROUP BY es.department_id, e.department_name
      ORDER BY total_employees DESC
    `;

    const result = await this.dataSource.query(query, [startDate, endDate, today]);

    return result.map((row: any) => ({
      department_id: row.department_id,
      department_name: row.department_name || `Department ${row.department_id}`,
      total_employees: parseInt(row.total_employees, 10),
      present: parseInt(row.present || 0, 10),
      on_leave: parseInt(row.on_leave || 0, 10),
      absent: parseInt(row.absent || 0, 10),
      availability_rate: parseFloat(row.availability_rate || 0),
    }));
  }

  private calculateTrend(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return Math.round(((currentValue - previousValue) / previousValue) * 100);
  }

  private getTrendDirection(currentValue: number, previousValue: number): 'up' | 'down' | 'stable' {
    if (currentValue > previousValue) return 'up';
    if (currentValue < previousValue) return 'down';
    return 'stable';
  }
}
