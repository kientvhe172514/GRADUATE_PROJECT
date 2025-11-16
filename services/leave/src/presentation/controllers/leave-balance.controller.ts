import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ApiResponseDto, CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import {
  GetBalanceQueryDto,
  InitializeLeaveBalancesDto,
  AdjustLeaveBalanceDto,
  CarryOverDto,
  ExpiringCarryOverQueryDto,
  LeaveBalanceResponseDto,
  LeaveBalanceSummaryDto,
  GetMyTransactionsQueryDto,
  LeaveBalanceTransactionResponseDto,
  LeaveBalanceStatisticsResponseDto,
} from '../../application/leave-balance/dto/leave-balance.dto';
import { GetEmployeeBalancesUseCase } from '../../application/leave-balance/use-cases/get-employee-balances.use-case';
import { GetEmployeeBalanceSummaryUseCase } from '../../application/leave-balance/use-cases/get-employee-balance-summary.use-case';
import { InitializeEmployeeBalancesUseCase } from '../../application/leave-balance/use-cases/initialize-employee-balances.use-case';
import { AdjustLeaveBalanceUseCase } from '../../application/leave-balance/use-cases/adjust-leave-balance.use-case';
import { CarryOverUseCase } from '../../application/leave-balance/use-cases/carry-over.use-case';
import { ListExpiringCarryOverUseCase } from '../../application/leave-balance/use-cases/list-expiring-carry-over.use-case';
import { GetMyTransactionsUseCase } from '../../application/leave-balance/use-cases/get-my-transactions.use-case';
import { GetMyStatisticsUseCase } from '../../application/leave-balance/use-cases/get-my-statistics.use-case';

@ApiTags('leave-balances')
@ApiBearerAuth('bearer')
@Controller('leave-balances')
export class LeaveBalanceController {
  constructor(
    private readonly getEmployeeBalances: GetEmployeeBalancesUseCase,
    private readonly getEmployeeBalanceSummary: GetEmployeeBalanceSummaryUseCase,
    private readonly initializeEmployeeBalances: InitializeEmployeeBalancesUseCase,
    private readonly adjustLeaveBalance: AdjustLeaveBalanceUseCase,
    private readonly carryOver: CarryOverUseCase,
    private readonly listExpiringCarryOver: ListExpiringCarryOverUseCase,
    private readonly getMyTransactions: GetMyTransactionsUseCase,
    private readonly getMyStatistics: GetMyStatisticsUseCase,
  ) {}

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get employee leave balances by year' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
        message: 'Employee leave balances retrieved successfully',
        data: [
          {
            id: 1,
            employee_id: 123,
            leave_type_id: 1,
            year: 2024,
            annual_entitlement: 12,
            remaining_balance: 9,
            used_balance: 3,
            pending_balance: 0,
            carry_over_from_previous_year: 2,
            carry_over_expiry_date: '2024-03-31',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T10:30:00Z',
          },
        ],
      },
    },
  })
  async getBalances(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query() query: GetBalanceQueryDto,
  ): Promise<ApiResponseDto<LeaveBalanceResponseDto[]>> {
    const year = query.year ?? new Date().getFullYear();
    const result = await this.getEmployeeBalances.execute(employeeId, year);
    const data = plainToInstance(LeaveBalanceResponseDto, result);
    return ApiResponseDto.success(data, 'Employee leave balances retrieved successfully');
  }

  @Get('me')
  async getMyBalances(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetBalanceQueryDto,
  ): Promise<ApiResponseDto<LeaveBalanceResponseDto[]>> {
    if (!user || !user.employee_id) throw new UnauthorizedException();
    const year = query.year ?? new Date().getFullYear();
    const result = await this.getEmployeeBalances.execute(user.employee_id, year);
    const data = plainToInstance(LeaveBalanceResponseDto, result);
    return ApiResponseDto.success(data, 'Your leave balances retrieved successfully');
  }

  @Get('employee/:employeeId/summary')
  async getSummary(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query() query: GetBalanceQueryDto,
  ): Promise<ApiResponseDto<LeaveBalanceSummaryDto>> {
    const year = query.year ?? new Date().getFullYear();
    const result = await this.getEmployeeBalanceSummary.execute(employeeId, year);
    const data = plainToInstance(LeaveBalanceSummaryDto, result);
    return ApiResponseDto.success(data, 'Employee leave balance summary retrieved successfully');
  }

  @Post('initialize')
  async initialize(@Body() dto: InitializeLeaveBalancesDto): Promise<ApiResponseDto<LeaveBalanceResponseDto[]>> {
    const result = await this.initializeEmployeeBalances.execute(dto.employee_id, dto.year);
    const data = plainToInstance(LeaveBalanceResponseDto, result);
    return ApiResponseDto.success(data, 'Leave balances initialized successfully', HttpStatus.CREATED);
  }

  @Post('adjust')
  async adjust(@Body() dto: AdjustLeaveBalanceDto): Promise<ApiResponseDto<LeaveBalanceResponseDto>> {
    const result = await this.adjustLeaveBalance.execute(
      dto.employee_id,
      dto.leave_type_id,
      dto.year,
      dto.adjustment,
      dto.description,
      dto.created_by,
    );
    const data = plainToInstance(LeaveBalanceResponseDto, result);
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

  // ========== EMPLOYEE SELF-SERVICE ENDPOINTS ==========

  @Get('me/summary')
  @ApiOperation({ summary: 'Get my leave balance summary for the current year' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Year (default: current year)' })
  async getMySummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetBalanceQueryDto,
  ): Promise<ApiResponseDto<LeaveBalanceSummaryDto>> {
    if (!user || !user.employee_id) throw new UnauthorizedException();
    const year = query.year ?? new Date().getFullYear();
    const result = await this.getEmployeeBalanceSummary.execute(user.employee_id, year);
    const data = plainToInstance(LeaveBalanceSummaryDto, result);
    return ApiResponseDto.success(data, 'Your leave balance summary retrieved successfully');
  }

  @Get('me/statistics')
  @ApiOperation({ summary: 'Get my detailed leave statistics' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Year (default: current year)' })
  async getMyLeaveStatistics(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetBalanceQueryDto,
  ): Promise<ApiResponseDto<LeaveBalanceStatisticsResponseDto>> {
    if (!user || !user.employee_id) throw new UnauthorizedException();
    const year = query.year ?? new Date().getFullYear();
    const result = await this.getMyStatistics.execute(user.employee_id, year);
    return ApiResponseDto.success(result, 'Your leave statistics retrieved successfully');
  }

  @Get('transactions/me')
  @ApiOperation({ summary: 'Get my leave balance transaction history' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'leave_type_id', required: false, type: Number })
  @ApiQuery({ name: 'transaction_type', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyLeaveTransactions(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetMyTransactionsQueryDto,
  ): Promise<ApiResponseDto<LeaveBalanceTransactionResponseDto[]>> {
    if (!user || !user.employee_id) throw new UnauthorizedException();
    const result = await this.getMyTransactions.execute(user.employee_id, query);
    const data = plainToInstance(LeaveBalanceTransactionResponseDto, result);
    return ApiResponseDto.success(data, 'Your transaction history retrieved successfully');
  }
}



