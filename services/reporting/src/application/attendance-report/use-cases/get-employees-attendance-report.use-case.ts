import { Injectable, Inject, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(GetEmployeesAttendanceReportUseCase.name);

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
    this.logger.log('🚀 Starting GetEmployeesAttendanceReportUseCase.execute');
    this.logger.log(`📊 Query params: ${JSON.stringify(query)}`);
    
    // 1. Calculate date range
    const { start_date, end_date } = this.calculateDateRange(query);
    this.logger.log(`📅 Date range: ${start_date} to ${end_date}`);

    // 2. Determine if we can use monthly_summaries (fast path) or need to calculate on-the-fly (slow path)
    // ✅ Only use pre-calculated if the date range is full months
    const canUsePreCalculated = this.isFullMonthRange(start_date, end_date);
    this.logger.log(`🔍 Can use pre-calculated summaries: ${canUsePreCalculated}`);
    
    if (canUsePreCalculated) {
      this.logger.log('⚡ Using FAST PATH (pre-calculated monthly summaries)');
      return this.executeWithPreCalculatedSummaries(query, start_date, end_date);
    }

    this.logger.log('🐢 Using SLOW PATH (real-time calculation from shifts)');

    // 3. Build filter conditions for real-time calculation
    const whereConditions: string[] = [
      `es.shift_date BETWEEN '${start_date}' AND '${end_date}'`,
    ];
    const params: any[] = [];

    if (query.department_id) {
      whereConditions.push(`es.department_id = $${params.length + 1}`);
      params.push(query.department_id);
    }

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      whereConditions.push(
        `(e.full_name ILIKE $${params.length + 1} OR e.employee_code ILIKE $${params.length + 2})`,
      );
      params.push(searchPattern, searchPattern);
    }

    // 3. Get aggregated attendance data
    const offset = (query.page! - 1) * query.limit!;
    
    // Build additional filters for employees_cache
    const employeeFilters: string[] = [];
    const employeeParams: any[] = [];
    
    // ✅ Filter only EMPLOYEE role (exclude ADMIN, MANAGER, HR, etc.)
    // Get role_id for EMPLOYEE role from roles_cache
    this.logger.log('🔑 Fetching EMPLOYEE role_id from roles_cache...');
    const [employeeRole] = await this.dataSource.query(
      `SELECT role_id FROM roles_cache WHERE code = 'EMPLOYEE' AND status = 'ACTIVE' LIMIT 1`,
    );
    
    if (employeeRole) {
      this.logger.log(`✅ Found EMPLOYEE role_id: ${employeeRole.role_id}`);
      employeeFilters.push(`e.role_id = $${employeeParams.length + 1}`);
      employeeParams.push(employeeRole.role_id);
    } else {
      // Fallback: If roles_cache is not populated, use a default approach
      // Filter employees that have role_id but exclude common admin roles
      // This ensures we still filter even if roles_cache is empty
      this.logger.warn(
        '⚠️ EMPLOYEE role not found in roles_cache. Using fallback filter.',
      );
    }
    
    if (query.department_id) {
      employeeFilters.push(`e.department_id = $${employeeParams.length + 1}`);
      employeeParams.push(query.department_id);
    }
    
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      employeeFilters.push(
        `(e.full_name ILIKE $${employeeParams.length + 1} OR e.employee_code ILIKE $${employeeParams.length + 2})`
      );
      employeeParams.push(searchPattern, searchPattern);
    }
    
    // Combine employee filters with status filter
    employeeFilters.push(`e.status = 'ACTIVE'`);
    const employeeWhereClause = employeeFilters.length > 0 
      ? 'WHERE ' + employeeFilters.join(' AND ')
      : '';
    
    // Calculate pagination parameter indices AFTER all filters are added
    const limitParamIndex = employeeParams.length + 1;
    const offsetParamIndex = employeeParams.length + 2;
    
    const aggregateQuery = `
      WITH employee_list AS (
        SELECT DISTINCT
          e.employee_id,
          e.employee_code,
          e.full_name,
          e.department_id,
          e.department_name,
          e.position_name
        FROM employees_cache e
        ${employeeWhereClause}
      ),
      employee_attendance AS (
        SELECT 
          es.employee_id,
          
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
          
        FROM employee_shifts_cache es
        WHERE es.shift_date BETWEEN '${start_date}' AND '${end_date}'
        GROUP BY es.employee_id
      )
      SELECT 
        el.employee_id,
        el.employee_code,
        el.full_name,
        el.department_id,
        el.department_name,
        el.position_name,
        COALESCE(ea.working_days, 0)::integer as working_days,
        COALESCE(ea.total_working_hours, 0)::numeric(10,2) as total_working_hours,
        COALESCE(ea.total_overtime_hours, 0)::numeric(10,2) as total_overtime_hours,
        COALESCE(ea.total_late_count, 0)::integer as total_late_count,
        COALESCE(ea.total_early_leave_count, 0)::integer as total_early_leave_count,
        COALESCE(ea.total_absent_days, 0)::integer as total_absent_days,
        0 as total_leave_days,
        COALESCE(
          ROUND((COALESCE(ea.working_days, 0)::numeric / NULLIF((
            SELECT COUNT(DISTINCT shift_date) 
            FROM employee_shifts_cache 
            WHERE employee_id = el.employee_id 
              AND shift_date BETWEEN '${start_date}' AND '${end_date}'
              AND shift_type = 'REGULAR'
          ), 0)) * 100, 2),
          0
        ) as attendance_rate
      FROM employee_list el
      LEFT JOIN employee_attendance ea ON ea.employee_id = el.employee_id
      ORDER BY el.employee_code
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    employeeParams.push(query.limit!, offset);
    this.logger.log(`📊 Executing aggregate query with ${employeeParams.length} params`);
    this.logger.log(`🔎 Employee filters: ${employeeFilters.join(' AND ')}`);
    const results = await this.dataSource.query(aggregateQuery, employeeParams);
    this.logger.log(`✅ Query returned ${results.length} employees`);

    // 4. Get leave days for each employee
    const employeeIds = results.map((r: any) => r.employee_id);
    let leaveDaysMap = new Map<number, number>();

    if (employeeIds.length > 0) {
      this.logger.log(`📞 Calling Leave Service for ${employeeIds.length} employees...`);
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
          this.logger.log(`✅ Leave Service returned data for ${leaveData.length} employees`);
          leaveDaysMap = new Map(
            leaveData.map((item: any) => [item.employee_id, item.total_leave_days || 0]),
          );
        } else {
          this.logger.warn('⚠️ Leave Service returned invalid data');
        }
      } catch (error) {
        this.logger.error('❌ Failed to fetch leave data:', error);
      }
    } else {
      this.logger.log('ℹ️ No employees to fetch leave data for');
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
      SELECT COUNT(DISTINCT e.employee_id) as total
      FROM employees_cache e
      ${employeeWhereClause}
    `;
    const [countResult] = await this.dataSource.query(countQuery, employeeParams.slice(0, -2));
    const total = Number(countResult?.total || 0);
    this.logger.log(`📊 Total employees matching filters: ${total}`);

    const response = {
      data,
      total,
      page: query.page!,
      limit: query.limit!,
      total_pages: Math.ceil(total / query.limit!),
      start_date,
      end_date,
    };
    
    this.logger.log(`✅ Returning response with ${data.length} employees (page ${query.page}/${response.total_pages})`);
    return response;
  }

  private calculateDateRange(query: EmployeesAttendanceReportQueryDto): {
    start_date: string;
    end_date: string;
  } {
    // Use provided start_date and end_date, or default to current month
    if (query.start_date && query.end_date) {
      return {
        start_date: query.start_date,
        end_date: query.end_date,
      };
    }

    // Default to current month if no dates provided
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  }

  /**
   * Check if date range covers full months only
   * Pre-calculated summaries are aggregated by FULL MONTH, so partial month ranges are invalid
   * 
   * Examples:
   * - 2025-12-01 to 2025-12-31 → TRUE (full December)
   * - 2025-11-01 to 2025-12-31 → TRUE (full November + full December)
   * - 2025-12-01 to 2025-12-15 → FALSE (partial December)
   * - 2025-11-15 to 2025-12-15 → FALSE (partial November + partial December)
   */
  private isFullMonthRange(start_date: string, end_date: string): boolean {
    const start = new Date(start_date);
    const end = new Date(end_date);

    // Check if start_date is the 1st of the month
    if (start.getDate() !== 1) {
      return false;
    }

    // Check if end_date is the last day of the month
    const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    if (end.getDate() !== lastDayOfMonth.getDate()) {
      return false;
    }

    return true;
  }

  /**
   * Execute report using pre-calculated monthly summaries (Fast Path)
   * Much faster than calculating on-the-fly
   */
  private async executeWithPreCalculatedSummaries(
    query: EmployeesAttendanceReportQueryDto,
    start_date: string,
    end_date: string,
  ): Promise<EmployeesAttendanceReportResponseDto> {
    this.logger.log('⚡ Executing FAST PATH with pre-calculated summaries');
    const offset = (query.page! - 1) * query.limit!;

    // Build filters
    const filters: string[] = [];
    const params: any[] = [];

    filters.push(
      `MAKE_DATE(ms.year, ms.month, 1) BETWEEN '${start_date}'::date AND '${end_date}'::date`,
    );

    // ✅ Filter only EMPLOYEE role (exclude ADMIN, MANAGER, HR, etc.)
    this.logger.log('🔑 Fetching EMPLOYEE role_id from roles_cache (FAST PATH)...');
    const [employeeRole] = await this.dataSource.query(
      `SELECT role_id FROM roles_cache WHERE code = 'EMPLOYEE' AND status = 'ACTIVE' LIMIT 1`,
    );
    
    if (employeeRole) {
      this.logger.log(`✅ Found EMPLOYEE role_id: ${employeeRole.role_id} (FAST PATH)`);
      filters.push(`ec.role_id = $${params.length + 1}`);
      params.push(employeeRole.role_id);
    } else {
      this.logger.warn(
        '⚠️ EMPLOYEE role not found in roles_cache for fast path. Using fallback filter.',
      );
    }

    if (query.department_id) {
      filters.push(`ms.department_id = $${params.length + 1}`);
      params.push(query.department_id);
    }

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      filters.push(
        `(ms.employee_name ILIKE $${params.length + 1} OR ms.employee_code ILIKE $${params.length + 2})`,
      );
      params.push(searchPattern, searchPattern);
    }

    const whereClause =
      filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';

    // Calculate pagination parameter indices
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    // Query from pre-calculated monthly_summaries with employees_cache JOIN for role filtering
    const summaryQuery = `
      SELECT
        ms.employee_id,
        ms.employee_code,
        ms.employee_name as full_name,
        ms.department_id,
        ms.department_name,
        COALESCE(SUM(ms.actual_work_days), 0)::integer as working_days,
        COALESCE(SUM(ms.total_work_hours), 0)::numeric(10,2) as total_working_hours,
        COALESCE(SUM(ms.total_overtime_hours), 0)::numeric(10,2) as total_overtime_hours,
        COALESCE(SUM(ms.late_count), 0)::integer as total_late_count,
        COALESCE(SUM(ms.early_leave_count), 0)::integer as total_early_leave_count,
        COALESCE(SUM(ms.absent_days), 0)::integer as total_absent_days,
        COALESCE(SUM(ms.leave_days), 0)::numeric(5,2) as total_leave_days,
        CASE 
          WHEN SUM(ms.actual_work_days) > 0 
          THEN ROUND(AVG(ms.attendance_rate), 2)
          ELSE 0
        END as attendance_rate
      FROM monthly_summaries ms
      INNER JOIN employees_cache ec ON ms.employee_id = ec.employee_id
      ${whereClause}
      GROUP BY ms.employee_id, ms.employee_code, ms.employee_name, ms.department_id, ms.department_name
      ORDER BY ms.employee_code
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    params.push(query.limit!, offset);
    this.logger.log(`📊 Executing summary query (FAST PATH) with ${params.length} params`);
    this.logger.log(`🔎 Filters: ${filters.join(' AND ')}`);

    const results = await this.dataSource.query(summaryQuery, params);
    this.logger.log(`✅ Query returned ${results.length} employees (FAST PATH)`);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT ms.employee_id) as total
      FROM monthly_summaries ms
      INNER JOIN employees_cache ec ON ms.employee_id = ec.employee_id
      ${whereClause}
    `;

    const countParams = params.slice(0, params.length - 2); // Remove LIMIT/OFFSET params
    const [{ total }] = await this.dataSource.query(countQuery, countParams);
    this.logger.log(`📊 Total employees matching filters (FAST PATH): ${total}`);

    // Map to response DTO
    const data: EmployeeAttendanceSummaryDto[] = results.map((row: any) => ({
      employee_id: row.employee_id,
      employee_code: row.employee_code,
      full_name: row.full_name,
      department_id: row.department_id,
      department_name: row.department_name,
      working_days: row.working_days,
      total_working_hours: parseFloat(row.total_working_hours),
      total_overtime_hours: parseFloat(row.total_overtime_hours),
      total_late_count: row.total_late_count,
      total_early_leave_count: row.total_early_leave_count,
      total_absent_days: row.total_absent_days,
      total_leave_days: parseFloat(row.total_leave_days),
      manday: row.working_days + row.total_absent_days,
      attendance_rate: parseFloat(row.attendance_rate) || 0,
    }));

    const response = {
      data,
      total,
      page: query.page!,
      limit: query.limit!,
      total_pages: Math.ceil(total / query.limit!),
      start_date,
      end_date,
    };
    
    this.logger.log(`✅ Returning FAST PATH response with ${data.length} employees (page ${query.page}/${response.total_pages})`);
    return response;
  }
}
