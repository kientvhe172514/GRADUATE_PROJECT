import { Controller, Get, Query, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiResponseDto, Permissions } from '@graduate-project/shared-common';
import {
  EmployeesAttendanceReportQueryDto,
  EmployeesAttendanceReportResponseDto,
  EmployeeAttendanceReportQueryDto,
  EmployeeAttendanceReportResponseDto,
} from '../../application/attendance-report/dto/attendance-report.dto';
import { GetEmployeesAttendanceReportUseCase } from '../../application/attendance-report/use-cases/get-employees-attendance-report.use-case';
import { GetEmployeeAttendanceReportUseCase } from '../../application/attendance-report/use-cases/get-employee-attendance-report.use-case';

@ApiTags('Attendance Reports')
@ApiBearerAuth('bearer')
@Controller('reports/attendance')
export class AttendanceReportController {
  constructor(
    private readonly getEmployeesAttendanceReportUseCase: GetEmployeesAttendanceReportUseCase,
    private readonly getEmployeeAttendanceReportUseCase: GetEmployeeAttendanceReportUseCase,
  ) {}

  @Get('employees')
  @HttpCode(HttpStatus.OK)
  @Permissions('report.attendance.read')
  @ApiOperation({
    summary: 'Get employees attendance report with filters',
    description: `
      Get aggregated attendance report for multiple employees.
      
      **Features:**
      - Filter by period (DAY, WEEK, MONTH, QUARTER, YEAR, CUSTOM)
      - Filter by department
      - Search by employee name or code
      - Pagination support
      
      **Report includes:**
      - Working days count
      - Total working hours
      - Overtime hours
      - Late arrivals and early leaves count
      - Leave days taken
      - Absent days (without approved leave)
      - Manday calculation
      - Attendance rate percentage
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Employees attendance report retrieved successfully',
    type: EmployeesAttendanceReportResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Employees attendance report retrieved successfully',
        data: {
          data: [
            {
              employee_id: 1,
              employee_code: 'EMP001',
              full_name: 'John Doe',
              department_id: 2,
              department_name: 'Engineering',
              position_name: 'Software Engineer',
              working_days: 22,
              total_working_hours: 176,
              total_overtime_hours: 8,
              total_late_count: 2,
              total_early_leave_count: 1,
              total_leave_days: 2,
              total_absent_days: 0,
              manday: 24,
              attendance_rate: 100,
            },
          ],
          total: 50,
          page: 1,
          limit: 20,
          total_pages: 3,
          period: 'MONTH',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        },
      },
    },
  })
  async getEmployeesReport(
    @Query() query: EmployeesAttendanceReportQueryDto,
  ): Promise<ApiResponseDto<EmployeesAttendanceReportResponseDto>> {
    const data = await this.getEmployeesAttendanceReportUseCase.execute(query);
    return ApiResponseDto.success(data, 'Employees attendance report retrieved successfully');
  }

  @Get('employee/:employeeId')
  @HttpCode(HttpStatus.OK)
  @Permissions('report.attendance.read')
  @ApiOperation({
    summary: 'Get detailed attendance report for a specific employee',
    description: `
      Get comprehensive daily attendance report for a single employee.
      
      **Features:**
      - Filter by period (DAY, WEEK, MONTH, QUARTER, YEAR, CUSTOM)
      - Daily breakdown of attendance
      - Complete employee information
      - Summary statistics
      
      **Daily details include:**
      - Check-in/out times with status (ON_TIME, LATE, EARLY, ABSENT, HOLIDAY, LEAVE)
      - Late minutes and early leave minutes
      - Working hours per day
      - Leave information (type and days)
      - Holiday information
      - Overtime hours with approval status
      - Manday calculation per day
      
      **Summary includes:**
      - Total working days, hours, overtime
      - Late/early leave counts
      - Leave days and absent days
      - Total manday and attendance rate
    `,
  })
  @ApiParam({ name: 'employeeId', description: 'Employee ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Employee attendance report retrieved successfully',
    type: EmployeeAttendanceReportResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Employee attendance report retrieved successfully',
        data: {
          employee: {
            employee_id: 1,
            employee_code: 'EMP001',
            full_name: 'John Doe',
            email: 'john.doe@company.com',
            department_id: 2,
            department_name: 'Engineering',
            position_name: 'Software Engineer',
            join_date: '2024-01-15',
          },
          period: {
            type: 'MONTH',
            start_date: '2025-01-01',
            end_date: '2025-01-31',
            total_days: 31,
          },
          summary: {
            total_working_days: 22,
            total_working_hours: 176,
            total_overtime_hours: 8,
            total_late_count: 2,
            total_early_leave_count: 1,
            total_leave_days: 2,
            total_absent_days: 0,
            total_holidays: 2,
            total_manday: 24,
            attendance_rate: 100,
          },
          daily_records: [
            {
              date: '2025-01-02',
              day_of_week: 'Monday',
              shift_name: 'Day Shift',
              scheduled_start_time: '08:00:00',
              scheduled_end_time: '17:00:00',
              check_in_time: '08:05:00',
              check_in_status: 'LATE',
              late_minutes: 5,
              check_out_time: '17:00:00',
              check_out_status: 'ON_TIME',
              working_hours: 8,
              overtime_hours: 0,
              is_holiday: false,
              manday: 1,
              remarks: 'COMPLETED',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeReport(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query() query: Omit<EmployeeAttendanceReportQueryDto, 'employee_id'>,
  ): Promise<ApiResponseDto<EmployeeAttendanceReportResponseDto>> {
    const fullQuery: EmployeeAttendanceReportQueryDto = {
      ...query,
      employee_id: employeeId,
    };
    const data = await this.getEmployeeAttendanceReportUseCase.execute(fullQuery);
    return ApiResponseDto.success(data, 'Employee attendance report retrieved successfully');
  }
}
