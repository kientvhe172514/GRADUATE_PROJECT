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
import { ShiftStatus } from '../../domain/entities/employee-shift.entity';
import { Request } from 'express';

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

  // Alias for convenience: /employee-shifts/me
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alias of /employee-shifts/my' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getMe(
    @Query() filter: EmployeeShiftFilterDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<{ data: EmployeeShiftDto[]; total: number }>> {
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

  @Get('employee/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get shifts for a specific employee within date range',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getEmployeeShifts(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query() filter: EmployeeShiftFilterDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<{ data: EmployeeShiftDto[]; total: number }>> {
    const effectiveFilter: EmployeeShiftFilterDto = {
      ...filter,
      employee_id: employeeId,
    };
    return this.getEmployeeShiftsUseCase.execute(effectiveFilter, user);
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

  @Get('today')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Today's attendance summary (checked-in vs not yet)",
    description:
      'Returns summary and lists of employees who have checked in (IN_PROGRESS/COMPLETED) and not yet checked in (SCHEDULED) for today. Optionally filter by department_id.',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getTodaySummary(
    @Query('department_id') departmentId?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<
    ApiResponseDto<{
      totals: {
        checked_in: number;
        in_progress: number;
        completed: number;
        not_checked_in: number;
        scheduled: number;
        on_leave: number;
        absent: number;
        all: number;
      };
      checkedIn: EmployeeShiftDto[];
      notCheckedIn: EmployeeShiftDto[];
    }>
  > {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Base filter for today
    const baseFilter: EmployeeShiftFilterDto = {
      from_date: dateStr,
      to_date: dateStr,
      limit: 10000,
      offset: 0,
      ...(departmentId ? { department_id: Number(departmentId) } : {}),
    };

    const safeUser: JwtPayload = user || ({} as unknown as JwtPayload);

    // Fetch IN_PROGRESS
    const inProgress = await this.getEmployeeShiftsUseCase.execute(
      { ...baseFilter, status: ShiftStatus.IN_PROGRESS },
      safeUser,
    );
    // Fetch COMPLETED
    const completed = await this.getEmployeeShiftsUseCase.execute(
      { ...baseFilter, status: ShiftStatus.COMPLETED },
      safeUser,
    );
    // Fetch SCHEDULED (not checked-in yet)
    const scheduled = await this.getEmployeeShiftsUseCase.execute(
      { ...baseFilter, status: ShiftStatus.SCHEDULED },
      safeUser,
    );
    // Optionally include ON_LEAVE and ABSENT for completeness
    const onLeave = await this.getEmployeeShiftsUseCase.execute(
      { ...baseFilter, status: ShiftStatus.ON_LEAVE },
      safeUser,
    );
    const absent = await this.getEmployeeShiftsUseCase.execute(
      { ...baseFilter, status: ShiftStatus.ABSENT },
      safeUser,
    );

    const checkedIn = [
      ...((inProgress.data?.data as EmployeeShiftDto[]) || []),
      ...((completed.data?.data as EmployeeShiftDto[]) || []),
    ];
    const notCheckedIn = (scheduled.data?.data as EmployeeShiftDto[]) || [];

    const totals = {
      checked_in: checkedIn.length,
      in_progress: inProgress.data?.total || 0,
      completed: completed.data?.total || 0,
      not_checked_in: notCheckedIn.length,
      scheduled: scheduled.data?.total || 0,
      on_leave: onLeave.data?.total || 0,
      absent: absent.data?.total || 0,
      all:
        (inProgress.data?.total || 0) +
        (completed.data?.total || 0) +
        (scheduled.data?.total || 0) +
        (onLeave.data?.total || 0) +
        (absent.data?.total || 0),
    };

    return ApiResponseDto.success(
      { totals, checkedIn, notCheckedIn },
      "Today's attendance summary retrieved successfully.",
    );
  }

  @Patch(':id/manual-edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually edit a shift (HR/Admin) and log changes' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async manualEditShift(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ManualEditShiftDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<ApiResponseDto<EmployeeShiftDto>> {
    const ip =
      req?.ip ||
      (req?.headers?.['x-forwarded-for'] as string | undefined) ||
      req?.socket?.remoteAddress;
    return this.manualEditShiftUseCase.execute(id, dto, user, String(ip || ''));
  }
}
