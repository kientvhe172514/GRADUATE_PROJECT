import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { CurrentUser, JwtPayload, Permissions, Public } from '@graduate-project/shared-common';
import {
  DailyReportQueryDto,
  MonthlyReportQueryDto,
  AnalyticsQueryDto,
} from '../dtos/report.dto';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@Public()
@Controller('reports')
export class ReportController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('daily')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get daily attendance report (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Daily report retrieved successfully',
  })
  async getDailyReport(@Query() query: DailyReportQueryDto) {
    const date = query.date ? new Date(query.date) : new Date();

    const report = await this.dataSource.query(
      `
      SELECT 
        es.shift_date,
        COUNT(DISTINCT es.employee_id) as total_employees,
        COUNT(DISTINCT CASE WHEN es.status = 'COMPLETED' THEN es.employee_id END) as attended,
        COUNT(DISTINCT CASE WHEN es.status = 'ABSENT' THEN es.employee_id END) as absent,
        COUNT(DISTINCT CASE WHEN es.status = 'ON_LEAVE' THEN es.employee_id END) as on_leave,
        COUNT(DISTINCT CASE WHEN es.late_minutes > 0 THEN es.employee_id END) as late_arrivals,
        COUNT(DISTINCT CASE WHEN es.early_leave_minutes > 0 THEN es.employee_id END) as early_leaves,
        SUM(es.work_hours) as total_work_hours,
        SUM(es.overtime_hours) as total_overtime_hours,
        AVG(es.work_hours) as avg_work_hours
      FROM employee_shifts es
      WHERE es.shift_date = $1
      ${query.department_id ? 'AND es.department_id = $2' : ''}
      GROUP BY es.shift_date
    `,
      query.department_id ? [date, query.department_id] : [date],
    );

    return {
      success: true,
      message: 'Daily report retrieved successfully',
      data: report[0] || {},
    };
  }

  @Get('daily/:date')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get daily report for specific date (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Daily report retrieved successfully',
  })
  async getDailyReportByDate(
    @Param('date') date: string,
    @Query('department_id', new ParseIntPipe({ optional: true }))
    departmentId?: number,
  ) {
    const report = await this.dataSource.query(
      `
      SELECT 
        es.shift_date,
        COUNT(DISTINCT es.employee_id) as total_employees,
        COUNT(DISTINCT CASE WHEN es.status = 'COMPLETED' THEN es.employee_id END) as attended,
        COUNT(DISTINCT CASE WHEN es.status = 'ABSENT' THEN es.employee_id END) as absent,
        COUNT(DISTINCT CASE WHEN es.status = 'ON_LEAVE' THEN es.employee_id END) as on_leave,
        COUNT(DISTINCT CASE WHEN es.late_minutes > 0 THEN es.employee_id END) as late_arrivals,
        COUNT(DISTINCT CASE WHEN es.early_leave_minutes > 0 THEN es.employee_id END) as early_leaves,
        SUM(es.work_hours) as total_work_hours,
        SUM(es.overtime_hours) as total_overtime_hours
      FROM employee_shifts es
      WHERE es.shift_date = $1
      ${departmentId ? 'AND es.department_id = $2' : ''}
      GROUP BY es.shift_date
    `,
      departmentId ? [date, departmentId] : [date],
    );

    return {
      success: true,
      message: 'Daily report retrieved successfully',
      data: report[0] || {},
    };
  }

  @Get('monthly/:year/:month')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get monthly attendance report (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Monthly report retrieved successfully',
  })
  async getMonthlyReport(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Query('department_id', new ParseIntPipe({ optional: true }))
    departmentId?: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const report = await this.dataSource.query(
      `
      SELECT 
        TO_CHAR(es.shift_date, 'YYYY-MM') as month,
        COUNT(DISTINCT es.employee_id) as total_employees,
        COUNT(DISTINCT CASE WHEN es.status = 'COMPLETED' THEN es.employee_id END) as attended_days,
        COUNT(DISTINCT CASE WHEN es.status = 'ABSENT' THEN es.employee_id END) as absent_days,
        COUNT(DISTINCT CASE WHEN es.status = 'ON_LEAVE' THEN es.employee_id END) as leave_days,
        SUM(es.work_hours) as total_work_hours,
        SUM(es.overtime_hours) as total_overtime_hours,
        SUM(es.late_minutes) as total_late_minutes,
        SUM(es.early_leave_minutes) as total_early_leave_minutes,
        COUNT(DISTINCT v.id) as total_violations
      FROM employee_shifts es
      LEFT JOIN violations v ON v.shift_id = es.id
      WHERE es.shift_date BETWEEN $1 AND $2
      ${departmentId ? 'AND es.department_id = $3' : ''}
      GROUP BY TO_CHAR(es.shift_date, 'YYYY-MM')
    `,
      departmentId ? [startDate, endDate, departmentId] : [startDate, endDate],
    );

    return {
      success: true,
      message: 'Monthly report retrieved successfully',
      data: report[0] || {},
    };
  }

  @Get('monthly/employee/:employeeId')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get monthly report for specific employee' })
  @ApiResponse({
    status: 200,
    description: 'Employee monthly report retrieved successfully',
  })
  async getEmployeeMonthlyReport(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const report = await this.dataSource.query(
      `
      SELECT 
        es.employee_id,
        es.employee_code,
        COUNT(DISTINCT es.id) as total_shifts,
        COUNT(DISTINCT CASE WHEN es.status = 'COMPLETED' THEN es.id END) as completed_shifts,
        COUNT(DISTINCT CASE WHEN es.status = 'ABSENT' THEN es.id END) as absent_days,
        COUNT(DISTINCT CASE WHEN es.status = 'ON_LEAVE' THEN es.id END) as leave_days,
        SUM(es.work_hours) as total_work_hours,
        SUM(es.overtime_hours) as total_overtime_hours,
        SUM(es.late_minutes) as total_late_minutes,
        SUM(es.early_leave_minutes) as total_early_leave_minutes,
        COUNT(DISTINCT v.id) as total_violations,
        COUNT(DISTINCT CASE WHEN v.resolved = false THEN v.id END) as unresolved_violations
      FROM employee_shifts es
      LEFT JOIN violations v ON v.shift_id = es.id AND v.employee_id = es.employee_id
      WHERE es.employee_id = $1
        AND es.shift_date BETWEEN $2 AND $3
      GROUP BY es.employee_id, es.employee_code
    `,
      [employeeId, startDate, endDate],
    );

    return {
      success: true,
      message: 'Employee monthly report retrieved successfully',
      data: report[0] || {},
    };
  }

  @Get('analytics/attendance-rate')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get attendance rate analytics (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Attendance rate analytics retrieved successfully',
  })
  async getAttendanceRate(@Query() query: AnalyticsQueryDto) {
    const startDate = new Date(
      query.start_date || new Date().toISOString().slice(0, 7) + '-01',
    );
    const endDate = new Date(
      query.end_date || new Date().toISOString().slice(0, 10),
    );

    const analytics = await this.dataSource.query(
      `
      SELECT 
        TO_CHAR(es.shift_date, 'YYYY-MM-DD') as date,
        COUNT(DISTINCT es.id) as total_shifts,
        COUNT(DISTINCT CASE WHEN es.status = 'COMPLETED' THEN es.id END) as attended_shifts,
        ROUND(
          (COUNT(DISTINCT CASE WHEN es.status = 'COMPLETED' THEN es.id END)::numeric / 
          NULLIF(COUNT(DISTINCT es.id), 0) * 100), 2
        ) as attendance_rate
      FROM employee_shifts es
      WHERE es.shift_date BETWEEN $1 AND $2
      ${query.department_id ? 'AND es.department_id = $3' : ''}
      GROUP BY es.shift_date
      ORDER BY es.shift_date
    `,
      query.department_id
        ? [startDate, endDate, query.department_id]
        : [startDate, endDate],
    );

    return {
      success: true,
      message: 'Attendance rate analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('analytics/punctuality')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get punctuality analytics (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Punctuality analytics retrieved successfully',
  })
  async getPunctuality(@Query() query: AnalyticsQueryDto) {
    const startDate = new Date(
      query.start_date || new Date().toISOString().slice(0, 7) + '-01',
    );
    const endDate = new Date(
      query.end_date || new Date().toISOString().slice(0, 10),
    );

    const analytics = await this.dataSource.query(
      `
      SELECT 
        TO_CHAR(es.shift_date, 'YYYY-MM-DD') as date,
        COUNT(DISTINCT es.id) as total_shifts,
        COUNT(DISTINCT CASE WHEN es.late_minutes = 0 THEN es.id END) as on_time_shifts,
        COUNT(DISTINCT CASE WHEN es.late_minutes > 0 THEN es.id END) as late_shifts,
        ROUND(
          (COUNT(DISTINCT CASE WHEN es.late_minutes = 0 THEN es.id END)::numeric / 
          NULLIF(COUNT(DISTINCT es.id), 0) * 100), 2
        ) as punctuality_rate,
        AVG(es.late_minutes) as avg_late_minutes
      FROM employee_shifts es
      WHERE es.shift_date BETWEEN $1 AND $2
        AND es.status = 'COMPLETED'
      ${query.department_id ? 'AND es.department_id = $3' : ''}
      GROUP BY es.shift_date
      ORDER BY es.shift_date
    `,
      query.department_id
        ? [startDate, endDate, query.department_id]
        : [startDate, endDate],
    );

    return {
      success: true,
      message: 'Punctuality analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('analytics/overtime-trends')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get overtime trends (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Overtime trends retrieved successfully',
  })
  async getOvertimeTrends(@Query() query: AnalyticsQueryDto) {
    const startDate = new Date(
      query.start_date || new Date().toISOString().slice(0, 7) + '-01',
    );
    const endDate = new Date(
      query.end_date || new Date().toISOString().slice(0, 10),
    );

    const analytics = await this.dataSource.query(
      `
      SELECT 
        TO_CHAR(es.shift_date, 'YYYY-MM-DD') as date,
        COUNT(DISTINCT CASE WHEN es.overtime_hours > 0 THEN es.employee_id END) as employees_with_ot,
        SUM(es.overtime_hours) as total_ot_hours,
        AVG(es.overtime_hours) as avg_ot_hours,
        COUNT(DISTINCT ot.id) as ot_requests_count,
        COUNT(DISTINCT CASE WHEN ot.status = 'APPROVED' THEN ot.id END) as approved_ot_requests
      FROM employee_shifts es
      LEFT JOIN overtime_requests ot ON ot.overtime_date = es.shift_date
      WHERE es.shift_date BETWEEN $1 AND $2
      ${query.department_id ? 'AND es.department_id = $3' : ''}
      GROUP BY es.shift_date
      ORDER BY es.shift_date
    `,
      query.department_id
        ? [startDate, endDate, query.department_id]
        : [startDate, endDate],
    );

    return {
      success: true,
      message: 'Overtime trends retrieved successfully',
      data: analytics,
    };
  }

  @Get('dashboard/today')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get today dashboard (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getTodayDashboard(
    @Query('department_id', new ParseIntPipe({ optional: true }))
    departmentId?: number,
  ) {
    const today = new Date();

    const dashboard = await this.dataSource.query(
      `
      SELECT 
        COUNT(DISTINCT es.employee_id) as total_employees,
        COUNT(DISTINCT CASE WHEN es.check_in_time IS NOT NULL THEN es.employee_id END) as checked_in,
        COUNT(DISTINCT CASE WHEN es.check_out_time IS NOT NULL THEN es.employee_id END) as checked_out,
        COUNT(DISTINCT CASE WHEN es.late_minutes > 0 THEN es.employee_id END) as late_today,
        COUNT(DISTINCT CASE WHEN es.status = 'ABSENT' THEN es.employee_id END) as absent_today,
        COUNT(DISTINCT CASE WHEN es.status = 'ON_LEAVE' THEN es.employee_id END) as on_leave_today,
        COUNT(DISTINCT v.id) as violations_today,
        COUNT(DISTINCT ot.id) as pending_ot_requests
      FROM employee_shifts es
      LEFT JOIN violations v ON v.shift_id = es.id AND DATE(v.detected_at) = CURRENT_DATE
      LEFT JOIN overtime_requests ot ON ot.status = 'PENDING'
      WHERE es.shift_date = CURRENT_DATE
      ${departmentId ? 'AND es.department_id = $1' : ''}
    `,
      departmentId ? [departmentId] : [],
    );

    return {
      success: true,
      message: 'Today dashboard retrieved successfully',
      data: dashboard[0] || {},
    };
  }
}
