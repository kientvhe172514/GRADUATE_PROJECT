import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { GetBalanceQueryDto, InitializeLeaveBalancesDto, AdjustLeaveBalanceDto, CarryOverDto, ExpiringCarryOverQueryDto, LeaveBalanceResponseDto, LeaveBalanceSummaryDto } from '../../application/leave-balance/dto/leave-balance.dto';
import { GetEmployeeBalancesUseCase } from '../../application/leave-balance/use-cases/get-employee-balances.use-case';
import { GetEmployeeBalanceSummaryUseCase } from '../../application/leave-balance/use-cases/get-employee-balance-summary.use-case';
import { InitializeEmployeeBalancesUseCase } from '../../application/leave-balance/use-cases/initialize-employee-balances.use-case';
import { AdjustLeaveBalanceUseCase } from '../../application/leave-balance/use-cases/adjust-leave-balance.use-case';
import { CarryOverUseCase } from '../../application/leave-balance/use-cases/carry-over.use-case';
import { ListExpiringCarryOverUseCase } from '../../application/leave-balance/use-cases/list-expiring-carry-over.use-case';

@Controller('leave-balances')
export class LeaveBalanceController {
  constructor(
    private readonly getEmployeeBalances: GetEmployeeBalancesUseCase,
    private readonly getEmployeeBalanceSummary: GetEmployeeBalanceSummaryUseCase,
    private readonly initializeEmployeeBalances: InitializeEmployeeBalancesUseCase,
    private readonly adjustLeaveBalance: AdjustLeaveBalanceUseCase,
    private readonly carryOver: CarryOverUseCase,
    private readonly listExpiringCarryOver: ListExpiringCarryOverUseCase,
  ) {}

  @Get('employee/:employeeId')
  async getBalances(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query() query: GetBalanceQueryDto,
  ): Promise<ApiResponseDto<LeaveBalanceResponseDto[]>> {
    const year = query.year ?? new Date().getFullYear();
    const data = await this.getEmployeeBalances.execute(employeeId, year);
    return ApiResponseDto.success(data, 'Employee leave balances retrieved successfully');
  }

  @Get('employee/:employeeId/summary')
  async getSummary(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query() query: GetBalanceQueryDto,
  ): Promise<ApiResponseDto<LeaveBalanceSummaryDto>> {
    const year = query.year ?? new Date().getFullYear();
    const data = await this.getEmployeeBalanceSummary.execute(employeeId, year);
    return ApiResponseDto.success(data, 'Employee leave balance summary retrieved successfully');
  }

  @Post('initialize')
  async initialize(@Body() dto: InitializeLeaveBalancesDto): Promise<ApiResponseDto<LeaveBalanceResponseDto[]>> {
    const data = await this.initializeEmployeeBalances.execute(dto.employee_id, dto.year);
    return ApiResponseDto.success(data, 'Leave balances initialized successfully', HttpStatus.CREATED);
  }

  @Post('adjust')
  async adjust(@Body() dto: AdjustLeaveBalanceDto): Promise<ApiResponseDto<LeaveBalanceResponseDto>> {
    const data = await this.adjustLeaveBalance.execute(
      dto.employee_id,
      dto.leave_type_id,
      dto.year,
      dto.adjustment,
      dto.description,
      dto.created_by,
    );
    return ApiResponseDto.success(data, 'Leave balance adjusted successfully');
  }

  @Post('carry-over')
  async carryOverEndpoint(@Body() dto: CarryOverDto): Promise<ApiResponseDto<any[]>> {
    const data = await this.carryOver.execute(dto.year);
    return ApiResponseDto.success(data, 'Carry over processed successfully');
  }

  @Get('expiring')
  async expiring(@Query() query: ExpiringCarryOverQueryDto): Promise<ApiResponseDto<any[]>> {
    const year = query.year ?? new Date().getFullYear();
    const data = await this.listExpiringCarryOver.execute(year);
    return ApiResponseDto.success(data, 'Expiring carry-over balances retrieved successfully');
  }
}


