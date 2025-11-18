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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Permissions, ApiResponseDto, Public } from '@graduate-project/shared-common';
import { EmployeeShiftFilterDto, EmployeeShiftDto } from '../../application/dtos/employee-shift.dto';
import { GetEmployeeShiftsUseCase } from '../../application/use-cases/employee-shift/get-employee-shifts.use-case';
import { GetShiftByIdUseCase } from '../../application/use-cases/employee-shift/get-shift-by-id.use-case';
import { ManualEditShiftUseCase } from '../../application/use-cases/employee-shift/manual-edit-shift.use-case';
import { ManualEditShiftDto } from '../dtos/employee-shift-edit.dto';

@ApiTags('Employee Shifts')
@ApiBearerAuth()
@Public()
@Controller('employee-shifts')
export class EmployeeShiftController {
  constructor(
    private readonly getEmployeeShiftsUseCase: GetEmployeeShiftsUseCase,
    private readonly getShiftByIdUseCase: GetShiftByIdUseCase,
    private readonly manualEditShiftUseCase: ManualEditShiftUseCase,
  ) {}

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


