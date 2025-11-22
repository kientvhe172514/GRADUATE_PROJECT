import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  EmployeesAttendanceReportQueryDto,
  EmployeesAttendanceReportResponseDto,
  EmployeeAttendanceSummaryDto,
  ReportPeriod,
} from '../dto/attendance-report.dto';

@Injectable()
export class GetEmployeesAttendanceReportUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('ATTENDANCE_SERVICE')
    private readonly attendanceService: ClientProxy,
    @Inject('LEAVE_SERVICE')
    private readonly leaveService: ClientProxy,
  ) {}

  async execute(
    query: EmployeesAttendanceReportQueryDto,
  ): Promise<EmployeesAttendanceReportResponseDto> {
    // 1. Calculate date range based on period
    const { start_date, end_date } = this.calculateDateRange(query);

    // 2. Build filter conditions
    const whereConditions: string[] = [
      `es.shift_date BETWEEN '${start_date}' AND '${end_date}'`,
    ];
    const params: any[] = [];

    if (query.department_id) {
      whereConditions.push(`es.department_id = $${params.length + 1}`);
      params.push(query.department_id);
    }

    if (query.search) {
      whereConditions.push(
        `(e.full_name ILIKE $${params.length + 1} OR e.employee_code ILIKE $${params.length + 1})`,
      );
      params.push(`%${query.search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // 3. Get aggregated attendance data
    const offset = (query.page! - 1) * query.limit!;
    const aggregateQuery = `
      WITH employee_attendance AS (
        SELECT 
          es.employee_id,
          es.employee_code,
          es.department_id,
          
          -- Working days count (REGULAR shifts that are COMPLETED)
          COUNT(DISTINCT CASE 
            WHEN es.shift_type = 'REGULAR' AND es.status = 'COMPLETED' 
            THEN es.shift_date 
          END) as working_days,
          
          -- Total working hours (REGULAR shifts)
          COALESCE(SUM(CASE WHEN es.shift_type = 'REGULAR' THEN es.work_hours ELSE 0 END), 0) as total_working_hours,
          
          -- Total overtime hours
          COALESCE(SUM(es.overtime_hours), 0) as total_overtime_hours,
          
          -- Late arrivals count
          COUNT(CASE WHEN es.late_minutes > 0 THEN 1 END) as total_late_count,
          
          -- Early leaves count
          COUNT(CASE WHEN es.early_leave_minutes > 0 THEN 1 END) as total_early_leave_count,
          
          -- Absent days (ABSENT status)
          COUNT(CASE WHEN es.status = 'ABSENT' THEN 1 END) as total_absent_days
          
        FROM employee_shifts es
        WHERE ${whereClause}
        GROUP BY es.employee_id, es.employee_code, es.department_id
      ),
      employee_info AS (
        SELECT DISTINCT ON (e.id)
          e.id as employee_id,
          e.employee_code,
          e.full_name,
          e.department_id,
          d.department_name,
          p.position_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN positions p ON p.id = e.position_id
        WHERE e.id IN (SELECT employee_id FROM employee_attendance)
      )
      SELECT 
        ei.employee_id,
        ei.employee_code,
        ei.full_name,
        ei.department_id,
        ei.department_name,
        ei.position_name,
        ea.working_days::integer,
        ea.total_working_hours::numeric(10,2),
        ea.total_overtime_hours::numeric(10,2),
        ea.total_late_count::integer,
        ea.total_early_leave_count::integer,
        ea.total_absent_days::integer,
        0 as total_leave_days,
        ROUND((ea.working_days::numeric / NULLIF((
          SELECT COUNT(DISTINCT shift_date) 
          FROM employee_shifts 
          WHERE employee_id = ei.employee_id 
            AND shift_date BETWEEN '${start_date}' AND '${end_date}'
            AND shift_type = 'REGULAR'
        ), 0)) * 100, 2) as attendance_rate
      FROM employee_info ei
      INNER JOIN employee_attendance ea ON ea.employee_id = ei.employee_id
      ORDER BY ei.employee_code
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(query.limit!, offset);

    const results = await this.dataSource.query(aggregateQuery, params);

    // 4. Get leave days for each employee
    const employeeIds = results.map((r: any) => r.employee_id);
    let leaveDaysMap = new Map<number, number>();

    if (employeeIds.length > 0) {
      try {
        const leaveData = await firstValueFrom(
          this.leaveService.send(
            { cmd: 'get_employee_leave_days_bulk' },
            {
              employee_ids: employeeIds,
              start_date,
              end_date,
            },
          ),
        );

        if (leaveData && Array.isArray(leaveData)) {
          leaveDaysMap = new Map(
            leaveData.map((item: any) => [item.employee_id, item.total_leave_days || 0]),
          );
        }
      } catch (error) {
        console.warn('Failed to fetch leave data:', error);
      }
    }

    // 5. Calculate manday for each employee
    const data: EmployeeAttendanceSummaryDto[] = results.map((row: any) => {
      const leaveDays = leaveDaysMap.get(row.employee_id) || 0;
      const workingDays = Number(row.working_days);
      const absentDays = Number(row.total_absent_days);

      // Manday = (working_days + leave_days) = days employee was supposed to work or had approved leave
      const manday = workingDays + leaveDays;

      return {
        employee_id: row.employee_id,
        employee_code: row.employee_code,
        full_name: row.full_name,
        department_id: row.department_id,
        department_name: row.department_name,
        position_name: row.position_name,
        working_days: workingDays,
        total_working_hours: Number(row.total_working_hours),
        total_overtime_hours: Number(row.total_overtime_hours),
        total_late_count: Number(row.total_late_count),
        total_early_leave_count: Number(row.total_early_leave_count),
        total_leave_days: leaveDays,
        total_absent_days: absentDays,
        manday: manday,
        attendance_rate: Number(row.attendance_rate) || 0,
      };
    });

    // 6. Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT es.employee_id) as total
      FROM employee_shifts es
      WHERE ${whereClause}
    `;
    const [countResult] = await this.dataSource.query(countQuery, params.slice(0, -2));
    const total = Number(countResult?.total || 0);

    return {
      data,
      total,
      page: query.page!,
      limit: query.limit!,
      total_pages: Math.ceil(total / query.limit!),
      period: query.period || ReportPeriod.MONTH,
      start_date,
      end_date,
    };
  }

  private calculateDateRange(query: EmployeesAttendanceReportQueryDto): {
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
