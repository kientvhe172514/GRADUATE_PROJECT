import {
  Controller,
  Patch,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Body,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtPayload,
  Permissions,
  ApiResponseDto,
  Public,
} from '@graduate-project/shared-common';
import {
  EmployeeShiftFilterDto,
  EmployeeShiftDto,
} from '../../application/dtos/employee-shift.dto';
import {
  EmployeeShiftCalendarQueryDto,
  EmployeeShiftCalendarResponseDto,
} from '../../application/dtos/employee-shift-calendar.dto';
import { GetEmployeeShiftsUseCase } from '../../application/use-cases/employee-shift/get-employee-shifts.use-case';
import { GetShiftByIdUseCase } from '../../application/use-cases/employee-shift/get-shift-by-id.use-case';
import { ManualEditShiftUseCase } from '../../application/use-cases/employee-shift/manual-edit-shift.use-case';
import { GetEmployeeShiftCalendarUseCase } from '../../application/use-cases/employee-shift/get-employee-shift-calendar.use-case';
import { GetMyAttendanceUseCase } from '../../application/use-cases/employee-shift/get-my-attendance.use-case';
import { ManualEditShiftDto } from '../dtos/employee-shift-edit.dto';
import {
  GetMyAttendanceQueryDto,
  GetMyAttendanceResponseDto,
} from '../dtos/my-attendance.dto';

@ApiTags('Employee Shifts')
@ApiBearerAuth()
@Public()
@Controller('employee-shifts')
export class EmployeeShiftController {
  constructor(
    private readonly getEmployeeShiftsUseCase: GetEmployeeShiftsUseCase,
    private readonly getShiftByIdUseCase: GetShiftByIdUseCase,
    private readonly manualEditShiftUseCase: ManualEditShiftUseCase,
    private readonly getEmployeeShiftCalendarUseCase: GetEmployeeShiftCalendarUseCase,
    private readonly getMyAttendanceUseCase: GetMyAttendanceUseCase,
  ) {}

  @Get('calendar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get employee shift calendar view (for displaying schedules)',
    description:
      'Returns a calendar view of employee shifts with employee details and work schedule information. ' +
      'Useful for HR dashboard to display employee work schedules in a calendar format.',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getCalendarView(
    @Query() query: EmployeeShiftCalendarQueryDto,
  ): Promise<ApiResponseDto<EmployeeShiftCalendarResponseDto>> {
    return this.getEmployeeShiftCalendarUseCase.execute(query);
  }

  @Get('my-attendance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my attendance with period filtering (day/week/month/year)',
    description:
      'Returns employee own attendance records with summary statistics. ' +
      'Period filters: ' +
      'DAY: Only reference_date | ' +
      'WEEK: Monday of week → reference_date | ' +
      'MONTH: 1st of month → reference_date | ' +
      'YEAR: Jan 1 → reference_date. ' +
      'Gets ALL attendance records (including weekends based on work schedule). ' +
      'Includes pagination and attendance summary (days present, absent, late, overtime, etc.)',
  })
  @ApiResponse({ status: 200, type: GetMyAttendanceResponseDto })
  async getMyAttendance(
    @Query() query: GetMyAttendanceQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<GetMyAttendanceResponseDto>> {
    return this.getMyAttendanceUseCase.execute(query, user);
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current employee shifts within date range' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getMyShifts(
    @Query() filter: EmployeeShiftFilterDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<{ data: EmployeeShiftDto[]; total: number }>> {
    // Force employee_id to be current user's employee_id
    const effectiveFilter: EmployeeShiftFilterDto = {
      ...filter,
      employee_id: user.employee_id!,
    };
    return this.getEmployeeShiftsUseCase.execute(effectiveFilter, user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get shifts by filters (HR/Manager)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getShifts(
    @Query() filter: EmployeeShiftFilterDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<{ data: EmployeeShiftDto[]; total: number }>> {
    return this.getEmployeeShiftsUseCase.execute(filter, user);
  }

  @Get('department/:departmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get shifts for a department within date range' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getDepartmentShifts(
    @Param('departmentId', ParseIntPipe) departmentId: number,
    @Query() filter: EmployeeShiftFilterDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<{ data: EmployeeShiftDto[]; total: number }>> {
    const effectiveFilter: EmployeeShiftFilterDto = {
      ...filter,
      department_id: departmentId,
    };
    return this.getEmployeeShiftsUseCase.execute(effectiveFilter, user);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get shift details by ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<EmployeeShiftDto>> {
    return this.getShiftByIdUseCase.execute(id);
  }

  @Patch(':id/manual-edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually edit a shift (HR/Admin) and log changes' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async manualEditShift(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ManualEditShiftDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ): Promise<ApiResponseDto<EmployeeShiftDto>> {
    const ip =
      req?.ip ||
      req?.headers?.['x-forwarded-for'] ||
      req?.connection?.remoteAddress;
    return this.manualEditShiftUseCase.execute(id, dto, user, String(ip || ''));
  }
}
