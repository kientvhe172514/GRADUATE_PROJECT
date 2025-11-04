import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CreateLeaveTypeUseCase } from '../../application/leave-type/use-cases/create-leave-type.use-case';
import { GetLeaveTypesUseCase } from '../../application/leave-type/use-cases/get-leave-types.use-case';
import { UpdateLeaveTypeUseCase } from '../../application/leave-type/use-cases/update-leave-type.use-case';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto, LeaveTypeResponseDto } from '../../application/leave-type/dto/leave-type.dto';

@ApiTags('Leave Types')
@Controller('leave-types')
export class LeaveTypeController {
  constructor(
    private readonly createLeaveTypeUseCase: CreateLeaveTypeUseCase,
    private readonly getLeaveTypesUseCase: GetLeaveTypesUseCase,
    private readonly updateLeaveTypeUseCase: UpdateLeaveTypeUseCase,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all leave types',
    description: 'Retrieve all leave types with optional filter for active status only'
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: String,
    description: 'Filter by active status (true/false)',
    example: 'true'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leave types retrieved successfully',
    type: [LeaveTypeResponseDto],
  })
  async getLeaveTypes(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return this.getLeaveTypesUseCase.execute(activeOnly);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create a new leave type',
    description: 'Create a new leave type with all configuration options'
  })
  @ApiBody({
    type: CreateLeaveTypeDto,
    examples: {
      annualLeave: {
        summary: 'Annual Leave',
        description: 'Standard paid annual leave',
        value: {
          leave_type_code: 'ANNUAL',
          leave_type_name: 'Annual Leave',
          description: 'Paid time off for vacation and personal matters',
          is_paid: true,
          requires_approval: true,
          requires_document: false,
          deducts_from_balance: true,
          max_days_per_year: 15,
          max_consecutive_days: 10,
          min_notice_days: 7,
          exclude_holidays: true,
          exclude_weekends: true,
          allow_carry_over: true,
          max_carry_over_days: 5,
          carry_over_expiry_months: 3,
          is_prorated: true,
          proration_basis: 'MONTHLY',
          is_accrued: false,
          accrual_start_month: 0,
          color_hex: '#3B82F6',
          icon: 'calendar-check',
          sort_order: 1,
        },
      },
      sickLeave: {
        summary: 'Sick Leave',
        description: 'Leave for medical reasons',
        value: {
          leave_type_code: 'SICK',
          leave_type_name: 'Sick Leave',
          description: 'Leave for medical treatment and recovery',
          is_paid: true,
          requires_approval: false,
          requires_document: true,
          deducts_from_balance: true,
          max_days_per_year: 12,
          max_consecutive_days: 5,
          min_notice_days: 0,
          exclude_holidays: true,
          exclude_weekends: true,
          allow_carry_over: false,
          carry_over_expiry_months: 3,
          is_prorated: false,
          proration_basis: 'MONTHLY',
          is_accrued: true,
          accrual_rate: 1,
          accrual_start_month: 0,
          color_hex: '#EF4444',
          icon: 'medical-cross',
          sort_order: 2,
        },
      },
      unpaidLeave: {
        summary: 'Unpaid Leave',
        description: 'Leave without pay',
        value: {
          leave_type_code: 'UNPAID',
          leave_type_name: 'Unpaid Leave',
          description: 'Leave without salary for personal reasons',
          is_paid: false,
          requires_approval: true,
          requires_document: false,
          deducts_from_balance: false,
          min_notice_days: 14,
          exclude_holidays: false,
          exclude_weekends: false,
          allow_carry_over: false,
          carry_over_expiry_months: 3,
          is_prorated: false,
          proration_basis: 'MONTHLY',
          is_accrued: false,
          accrual_start_month: 0,
          color_hex: '#9CA3AF',
          icon: 'pause-circle',
          sort_order: 10,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Leave type created successfully',
    type: LeaveTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or leave type code already exists',
    schema: {
      example: {
        statusCode: 400,
        message: 'Leave type code already exists',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation failed',
    schema: {
      example: {
        statusCode: 422,
        message: ['leave_type_code must be uppercase letters and underscores only'],
        error: 'Unprocessable Entity',
      },
    },
  })
  async createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.createLeaveTypeUseCase.execute(dto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update a leave type',
    description: 'Update an existing leave type by ID'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Leave type ID',
    example: 1,
  })
  @ApiBody({
    type: UpdateLeaveTypeDto,
    examples: {
      updateMaxDays: {
        summary: 'Update max days',
        value: {
          max_days_per_year: 18,
          max_carry_over_days: 6,
        },
      },
      deactivate: {
        summary: 'Deactivate leave type',
        value: {
          status: 'INACTIVE',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leave type updated successfully',
    type: LeaveTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Leave type not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Leave type not found',
        error: 'Not Found',
      },
    },
  })
  async updateLeaveType(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    return this.updateLeaveTypeUseCase.execute(parseInt(id), dto);
  }
}

