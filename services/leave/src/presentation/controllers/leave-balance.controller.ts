import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { GetEmployeeBalanceUseCase } from '../../application/leave-balance/use-cases/get-employee-balance.use-case';
import { GetEmployeeBalanceSummaryUseCase } from '../../application/leave-balance/use-cases/get-employee-balance-summary.use-case';
import { InitializeLeaveBalanceUseCase } from '../../application/leave-balance/use-cases/initialize-leave-balance.use-case';
import { AdjustLeaveBalanceUseCase } from '../../application/leave-balance/use-cases/adjust-leave-balance.use-case';
import { CarryOverLeaveBalanceUseCase } from '../../application/leave-balance/use-cases/carry-over-leave-balance.use-case';
import {
  GetLeaveBalanceQueryDto,
  InitializeLeaveBalanceDto,
  AdjustLeaveBalanceDto,
  CarryOverLeaveBalanceDto,
} from '../../application/leave-balance/dto/leave-balance.dto';

@ApiTags('Leave Balances')
@Controller('leave-balances')
export class LeaveBalanceController {
  constructor(
    private readonly getEmployeeBalanceUseCase: GetEmployeeBalanceUseCase,
    private readonly getEmployeeBalanceSummaryUseCase: GetEmployeeBalanceSummaryUseCase,
    private readonly initializeLeaveBalanceUseCase: InitializeLeaveBalanceUseCase,
    private readonly adjustLeaveBalanceUseCase: AdjustLeaveBalanceUseCase,
    private readonly carryOverLeaveBalanceUseCase: CarryOverLeaveBalanceUseCase,
  ) {}

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Get employee leave balances',
    description: 'Retrieve all leave balances for a specific employee for a given year'
  })
  @ApiParam({
    name: 'employeeId',
    type: Number,
    description: 'Employee ID',
    example: 1001,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Year to query (defaults to current year)',
    example: 2025,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leave balances retrieved successfully',
  })
  async getEmployeeBalance(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query() query: GetLeaveBalanceQueryDto,
  ) {
    try {
      return await this.getEmployeeBalanceUseCase.execute(employeeId, query.year);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get employee balance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('employee/:employeeId/summary')
  @ApiOperation({
    summary: 'Get employee balance summary',
    description: 'Get a comprehensive summary of all leave types and total balances for an employee'
  })
  @ApiParam({
    name: 'employeeId',
    type: Number,
    description: 'Employee ID',
    example: 1001,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Year to query (defaults to current year)',
    example: 2025,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance summary retrieved successfully',
  })
  async getEmployeeBalanceSummary(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query() query: GetLeaveBalanceQueryDto,
  ) {
    try {
      return await this.getEmployeeBalanceSummaryUseCase.execute(employeeId, query.year);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get employee balance summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize leave balances',
    description: 'Initialize leave balances for a new employee with proration if applicable'
  })
  @ApiBody({
    type: InitializeLeaveBalanceDto,
    examples: {
      newEmployee: {
        summary: 'New employee starting mid-year',
        value: {
          employee_id: 1001,
          employment_start_date: '2025-06-01',
          year: 2025,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Leave balances initialized successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to initialize leave balances',
  })
  async initializeLeaveBalance(@Body() dto: InitializeLeaveBalanceDto) {
    try {
      return await this.initializeLeaveBalanceUseCase.execute(dto);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to initialize leave balance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('adjust')
  @ApiOperation({
    summary: 'Adjust leave balance',
    description: 'Manually adjust an employee\'s leave balance (admin/manager only)'
  })
  @ApiBody({
    type: AdjustLeaveBalanceDto,
    examples: {
      addDays: {
        summary: 'Add extra days',
        value: {
          employee_id: 1001,
          leave_type_id: 1,
          year: 2025,
          adjustment_days: 5,
          reason: 'Bonus leave for exceptional performance',
          adjusted_by: 2001,
        },
      },
      deductDays: {
        summary: 'Deduct days',
        value: {
          employee_id: 1001,
          leave_type_id: 1,
          year: 2025,
          adjustment_days: -2,
          reason: 'Correction for unauthorized absence',
          adjusted_by: 2001,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leave balance adjusted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Leave balance not found',
  })
  async adjustLeaveBalance(@Body() dto: AdjustLeaveBalanceDto) {
    try {
      return await this.adjustLeaveBalanceUseCase.execute(dto);
    } catch (error: any) {
      if (error.message === 'Leave balance not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || 'Failed to adjust leave balance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('carry-over')
  @ApiOperation({
    summary: 'Carry over leave balance',
    description: 'Process carry-over of unused leave from previous year (typically run as cron job at year end)'
  })
  @ApiBody({
    type: CarryOverLeaveBalanceDto,
    examples: {
      singleEmployee: {
        summary: 'Carry over for single employee',
        value: {
          employee_id: 1001,
          from_year: 2024,
          to_year: 2025,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carry over processed successfully',
  })
  async carryOverLeaveBalance(@Body() dto: CarryOverLeaveBalanceDto) {
    try {
      return await this.carryOverLeaveBalanceUseCase.execute(dto);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to carry over leave balance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
