import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  HighlightReportDetailQueryDto,
  HighlightDetailResponseDto,
  TopEmployeeDto,
  HighlightCategory,
  HighlightPeriod,
} from '../dto/highlight-report.dto';

@Injectable()
export class GetHighlightDetailUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: HighlightReportDetailQueryDto): Promise<HighlightDetailResponseDto> {
    const { start_date, end_date, label } = this.calculatePeriodDates(
      query.period || HighlightPeriod.MONTH,
      query.start_date,
      query.end_date
    );
    const departmentFilter = query.department_id ? `AND es.department_id = ${query.department_id}` : '';
    const topN = query.top_n || 5;

    let topEmployees: TopEmployeeDto[] = [];
    let summary: any = {};

    switch (query.category) {
      case HighlightCategory.LATE:
        ({ topEmployees, summary } = await this.getTopLateDetail(start_date, end_date, departmentFilter, topN));
        break;
      case HighlightCategory.EARLY:
        ({ topEmployees, summary } = await this.getTopEarlyDetail(start_date, end_date, departmentFilter, topN));
        break;
      case HighlightCategory.LEAVE:
        ({ topEmployees, summary } = await this.getTopLeaveDetail(start_date, end_date, departmentFilter, topN));
        break;
      case HighlightCategory.OVERTIME:
        ({ topEmployees, summary } = await this.getTopOvertimeDetail(start_date, end_date, departmentFilter, topN));
        break;
      case HighlightCategory.UNUSUAL_ABSENCE:
        ({ topEmployees, summary } = await this.getUnusualAbsenceDetail(start_date, end_date, departmentFilter, topN));
        break;
    }

    return {
      category: query.category,
      period: {
        type: query.period || HighlightPeriod.MONTH,
        start_date,
        end_date,
        label,
      },
      department: query.department_id ? await this.getDepartmentInfo(query.department_id) : undefined,
      top_employees: topEmployees,
      summary,
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
    return {
      department_id: departmentId,
      department_name: 'Department ' + departmentId,
    };
  }

  private async getTopLateDetail(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    topN: number,
  ): Promise<{ topEmployees: TopEmployeeDto[]; summary: any }> {
    const employeesQuery = `
      SELECT 
        es.employee_id,
        es.employee_code,
        e.full_name,
        e.department_name,
        e.position_name,
        e.avatar_url,
        COUNT(*) as late_count,
        SUM(es.late_minutes) as total_late_minutes,
        ROUND(AVG(es.late_minutes), 2) as avg_late_minutes
      FROM employee_shifts es
      LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.late_minutes > 0
        ${departmentFilter}
      GROUP BY es.employee_id, es.employee_code, e.full_name, e.department_name, e.position_name, e.avatar_url
      ORDER BY late_count DESC, total_late_minutes DESC
      LIMIT $3
    `;

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_count,
        ROUND(AVG(late_count), 2) as average_per_employee,
        MAX(late_count) as highest_value,
        MIN(late_count) as lowest_value
      FROM (
        SELECT COUNT(*) as late_count
        FROM employee_shifts es
        WHERE es.shift_date BETWEEN $1 AND $2
          AND es.late_minutes > 0
          ${departmentFilter}
        GROUP BY es.employee_id
      ) sub
    `;

    const [employees, summaryResult] = await Promise.all([
      this.dataSource.query(employeesQuery, [startDate, endDate, topN]),
      this.dataSource.query(summaryQuery, [startDate, endDate]),
    ]);

    const summaryRow = summaryResult[0] || { total_count: 0, average_per_employee: 0, highest_value: 0, lowest_value: 0 };

    return {
      topEmployees: employees.map((e: any) => ({
        employee_id: e.employee_id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        department_name: e.department_name,
        position_name: e.position_name,
        avatar_url: e.avatar_url,
        count: parseInt(e.late_count, 10),
        metric_value: parseFloat(e.total_late_minutes),
        rate: parseFloat(e.avg_late_minutes),
      })),
      summary: {
        total_count: parseInt(summaryRow.total_count, 10),
        average_per_employee: parseFloat(summaryRow.average_per_employee),
        highest_value: parseInt(summaryRow.highest_value, 10),
        lowest_value: parseInt(summaryRow.lowest_value, 10),
      },
    };
  }

  private async getTopEarlyDetail(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    topN: number,
  ): Promise<{ topEmployees: TopEmployeeDto[]; summary: any }> {
    const employeesQuery = `
      SELECT 
        es.employee_id,
        es.employee_code,
        e.full_name,
        e.department_name,
        e.position_name,
        e.avatar_url,
        COUNT(*) as early_count,
        SUM(es.early_leave_minutes) as total_early_minutes,
        ROUND(AVG(es.early_leave_minutes), 2) as avg_early_minutes
      FROM employee_shifts es
      LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.early_leave_minutes > 0
        ${departmentFilter}
      GROUP BY es.employee_id, es.employee_code, e.full_name, e.department_name, e.position_name, e.avatar_url
      ORDER BY early_count DESC, total_early_minutes DESC
      LIMIT $3
    `;

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_count,
        ROUND(AVG(early_count), 2) as average_per_employee,
        MAX(early_count) as highest_value,
        MIN(early_count) as lowest_value
      FROM (
        SELECT COUNT(*) as early_count
        FROM employee_shifts es
        WHERE es.shift_date BETWEEN $1 AND $2
          AND es.early_leave_minutes > 0
          ${departmentFilter}
        GROUP BY es.employee_id
      ) sub
    `;

    const [employees, summaryResult] = await Promise.all([
      this.dataSource.query(employeesQuery, [startDate, endDate, topN]),
      this.dataSource.query(summaryQuery, [startDate, endDate]),
    ]);

    const summaryRow = summaryResult[0] || { total_count: 0, average_per_employee: 0, highest_value: 0, lowest_value: 0 };

    return {
      topEmployees: employees.map((e: any) => ({
        employee_id: e.employee_id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        department_name: e.department_name,
        position_name: e.position_name,
        avatar_url: e.avatar_url,
        count: parseInt(e.early_count, 10),
        metric_value: parseFloat(e.total_early_minutes),
        rate: parseFloat(e.avg_early_minutes),
      })),
      summary: {
        total_count: parseInt(summaryRow.total_count, 10),
        average_per_employee: parseFloat(summaryRow.average_per_employee),
        highest_value: parseInt(summaryRow.highest_value, 10),
        lowest_value: parseInt(summaryRow.lowest_value, 10),
      },
    };
  }

  private async getTopLeaveDetail(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    topN: number,
  ): Promise<{ topEmployees: TopEmployeeDto[]; summary: any }> {
    const employeesQuery = `
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

    const summaryQuery = `
      SELECT 
        SUM(total_days) as total_count,
        ROUND(AVG(total_days), 2) as average_per_employee,
        MAX(total_days) as highest_value,
        MIN(total_days) as lowest_value
      FROM (
        SELECT SUM(te.leave_days) as total_days
        FROM timesheet_entries te
        WHERE te.entry_date BETWEEN $1 AND $2
          AND te.leave_days > 0
          ${departmentFilter.replace('es.', 'te.')}
        GROUP BY te.employee_id
      ) sub
    `;

    const [employees, summaryResult] = await Promise.all([
      this.dataSource.query(employeesQuery, [startDate, endDate, topN]),
      this.dataSource.query(summaryQuery, [startDate, endDate]),
    ]);

    const summaryRow = summaryResult[0] || { total_count: 0, average_per_employee: 0, highest_value: 0, lowest_value: 0 };

    return {
      topEmployees: employees.map((e: any) => ({
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
      summary: {
        total_count: parseFloat(summaryRow.total_count || 0),
        average_per_employee: parseFloat(summaryRow.average_per_employee),
        highest_value: parseFloat(summaryRow.highest_value),
        lowest_value: parseFloat(summaryRow.lowest_value),
      },
    };
  }

  private async getTopOvertimeDetail(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    topN: number,
  ): Promise<{ topEmployees: TopEmployeeDto[]; summary: any }> {
    const employeesQuery = `
      SELECT 
        es.employee_id,
        es.employee_code,
        e.full_name,
        e.department_name,
        e.position_name,
        e.avatar_url,
        SUM(es.overtime_hours) as total_ot_hours,
        COUNT(*) as ot_shift_count,
        ROUND(AVG(es.overtime_hours), 2) as avg_ot_per_shift
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

    const summaryQuery = `
      SELECT 
        SUM(total_hours) as total_count,
        ROUND(AVG(total_hours), 2) as average_per_employee,
        MAX(total_hours) as highest_value,
        MIN(total_hours) as lowest_value
      FROM (
        SELECT SUM(es.overtime_hours) as total_hours
        FROM employee_shifts es
        WHERE es.shift_date BETWEEN $1 AND $2
          AND es.shift_type = 'OVERTIME'
          AND es.overtime_hours > 0
          ${departmentFilter}
        GROUP BY es.employee_id
      ) sub
    `;

    const [employees, summaryResult] = await Promise.all([
      this.dataSource.query(employeesQuery, [startDate, endDate, topN]),
      this.dataSource.query(summaryQuery, [startDate, endDate]),
    ]);

    const summaryRow = summaryResult[0] || { total_count: 0, average_per_employee: 0, highest_value: 0, lowest_value: 0 };

    return {
      topEmployees: employees.map((e: any) => ({
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
      summary: {
        total_count: parseFloat(summaryRow.total_count || 0),
        average_per_employee: parseFloat(summaryRow.average_per_employee),
        highest_value: parseFloat(summaryRow.highest_value),
        lowest_value: parseFloat(summaryRow.lowest_value),
      },
    };
  }

  private async getUnusualAbsenceDetail(
    startDate: string,
    endDate: string,
    departmentFilter: string,
    topN: number,
  ): Promise<{ topEmployees: TopEmployeeDto[]; summary: any }> {
    const employeesQuery = `
      WITH absence_data AS (
        SELECT 
          es.employee_id,
          es.employee_code,
          e.full_name,
          e.department_name,
          e.position_name,
          e.avatar_url,
          COUNT(*) FILTER (WHERE es.status = 'ABSENT') as absent_count
        FROM employee_shifts es
        LEFT JOIN employee_cache e ON e.employee_id = es.employee_id
        WHERE es.shift_date BETWEEN $1 AND $2
          ${departmentFilter}
        GROUP BY es.employee_id, es.employee_code, e.full_name, e.department_name, e.position_name, e.avatar_url
        HAVING COUNT(*) FILTER (WHERE es.status = 'ABSENT') >= 3
      )
      SELECT *
      FROM absence_data
      ORDER BY absent_count DESC
      LIMIT $3
    `;

    const summaryQuery = `
      SELECT 
        SUM(absent_count) as total_count,
        ROUND(AVG(absent_count), 2) as average_per_employee,
        MAX(absent_count) as highest_value,
        MIN(absent_count) as lowest_value
      FROM (
        SELECT COUNT(*) FILTER (WHERE es.status = 'ABSENT') as absent_count
        FROM employee_shifts es
        WHERE es.shift_date BETWEEN $1 AND $2
          ${departmentFilter}
        GROUP BY es.employee_id
        HAVING COUNT(*) FILTER (WHERE es.status = 'ABSENT') >= 3
      ) sub
    `;

    const [employees, summaryResult] = await Promise.all([
      this.dataSource.query(employeesQuery, [startDate, endDate, topN]),
      this.dataSource.query(summaryQuery, [startDate, endDate]),
    ]);

    const summaryRow = summaryResult[0] || { total_count: 0, average_per_employee: 0, highest_value: 0, lowest_value: 0 };

    return {
      topEmployees: employees.map((e: any) => ({
        employee_id: e.employee_id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        department_name: e.department_name,
        position_name: e.position_name,
        avatar_url: e.avatar_url,
        count: parseInt(e.absent_count, 10),
        metric_value: null,
        rate: null,
      })),
      summary: {
        total_count: parseInt(summaryRow.total_count || 0, 10),
        average_per_employee: parseFloat(summaryRow.average_per_employee),
        highest_value: parseInt(summaryRow.highest_value || 0, 10),
        lowest_value: parseInt(summaryRow.lowest_value || 0, 10),
      },
    };
  }
}
