import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ApiResponseDto, CurrentUser, JwtPayload, Permissions } from '@graduate-project/shared-common';
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
  CreateBalancesForAllEmployeesDto,
} from '../../application/leave-balance/dto/leave-balance.dto';
import { GetEmployeeBalancesUseCase } from '../../application/leave-balance/use-cases/get-employee-balances.use-case';
import { GetEmployeeBalanceSummaryUseCase } from '../../application/leave-balance/use-cases/get-employee-balance-summary.use-case';
import { InitializeEmployeeBalancesUseCase } from '../../application/leave-balance/use-cases/initialize-employee-balances.use-case';
import { AdjustLeaveBalanceUseCase } from '../../application/leave-balance/use-cases/adjust-leave-balance.use-case';
import { CarryOverUseCase } from '../../application/leave-balance/use-cases/carry-over.use-case';
import { ListExpiringCarryOverUseCase } from '../../application/leave-balance/use-cases/list-expiring-carry-over.use-case';
import { GetMyTransactionsUseCase } from '../../application/leave-balance/use-cases/get-my-transactions.use-case';
import { GetMyStatisticsUseCase } from '../../application/leave-balance/use-cases/get-my-statistics.use-case';
import { CreateAllEmployeeBalancesUseCase } from '../../application/leave-balance/use-cases/create-all-employee-balances.use-case';

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
    private readonly createAllEmployeeBalances: CreateAllEmployeeBalancesUseCase,
  ) {}

  @Get('employee/:employeeId')
  @Permissions('leave.balance.read')
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
  @Permissions('leave.balance.read_own')
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
  @Permissions('leave.balance.read')
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
  @Permissions('leave.balance.update')
  async initialize(@Body() dto: InitializeLeaveBalancesDto): Promise<ApiResponseDto<LeaveBalanceResponseDto[]>> {
    const result = await this.initializeEmployeeBalances.execute(dto.employee_id, dto.year);
    const data = plainToInstance(LeaveBalanceResponseDto, result);
    return ApiResponseDto.success(data, 'Leave balances initialized successfully', HttpStatus.CREATED);
  }

  @Post('adjust')
  @Permissions('leave.balance.update')
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
  @Permissions('leave.balance.update')
  async carryOverEndpoint(@Body() dto: CarryOverDto): Promise<ApiResponseDto<any[]>> {
    const data = await this.carryOver.execute(dto.year);
    return ApiResponseDto.success(data, 'Carry over processed successfully');
  }

  @Get('expiring')
  @Permissions('leave.balance.read')
  async expiring(@Query() query: ExpiringCarryOverQueryDto): Promise<ApiResponseDto<any[]>> {
    const year = query.year ?? new Date().getFullYear();
    const data = await this.listExpiringCarryOver.execute(year);
    return ApiResponseDto.success(data, 'Expiring carry-over balances retrieved successfully');
  }

  // ========== EMPLOYEE SELF-SERVICE ENDPOINTS ==========

  @Get('me/summary')
  @Permissions('leave.balance.read_own')
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
  @Permissions('leave.balance.read_own')
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
  @Permissions('leave.balance.read_own')
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

  // ========== CRONJOB ENDPOINTS FOR LEAVE BALANCE CREATION ==========

  @Post('create-for-all')
  @Permissions('leave.balance.update')
  @ApiOperation({
    summary: 'Create leave balances for all employees (Cronjob API)',
    description:
      'Creates leave balances for all active employees for a specific year. ' +
      'This endpoint is designed to be called by a cronjob when a new year starts or when new employees are added. ' +
      'If employee_id is provided, only creates balances for that specific employee.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
        message: 'Leave balances created successfully',
        data: {
          processed: 500,
          created: 2500,
          skipped: 100,
          failed: 0,
          message: 'Processed 500 combinations, created 2500, skipped 100, failed 0',
        },
      },
    },
  })
  async createBalancesForAll(
    @Body() dto: CreateBalancesForAllEmployeesDto,
  ): Promise<ApiResponseDto<any>> {
    const year = dto.year ?? new Date().getFullYear();
    const result = await this.createAllEmployeeBalances.execute(year, dto.employee_id);
    return ApiResponseDto.success(
      result,
      'Leave balances created successfully',
      HttpStatus.OK,
    );
  }
}


