import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, ParseIntPipe, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ApiResponseDto } from '@graduate-project/shared-common';
import {
  CreateLeaveRequestDto,
  UpdateLeaveRecordDto,
  LeaveRecordResponseDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  CancelLeaveDto,
  GetLeaveRecordsQueryDto,
} from '../../application/leave-record/dto/leave-record.dto';
import { CreateLeaveRequestUseCase } from '../../application/leave-record/use-cases/create-leave-request.use-case';
import { ApproveLeaveUseCase } from '../../application/leave-record/use-cases/approve-leave.use-case';
import { RejectLeaveUseCase } from '../../application/leave-record/use-cases/reject-leave.use-case';
import { CancelLeaveUseCase } from '../../application/leave-record/use-cases/cancel-leave.use-case';
import { GetLeaveRecordsUseCase } from '../../application/leave-record/use-cases/get-leave-records.use-case';
import { GetLeaveRecordByIdUseCase } from '../../application/leave-record/use-cases/get-leave-record-by-id.use-case';
import { UpdateLeaveRequestUseCase } from '../../application/leave-record/use-cases/update-leave-request.use-case';

@ApiTags('leave-records')
@ApiBearerAuth('bearer')
@Controller('leave-records')
export class LeaveRecordController {
  constructor(
    private readonly createLeaveRequestUseCase: CreateLeaveRequestUseCase,
    private readonly approveLeaveUseCase: ApproveLeaveUseCase,
    private readonly rejectLeaveUseCase: RejectLeaveUseCase,
    private readonly cancelLeaveUseCase: CancelLeaveUseCase,
    private readonly getLeaveRecordsUseCase: GetLeaveRecordsUseCase,
    private readonly getLeaveRecordByIdUseCase: GetLeaveRecordByIdUseCase,
    private readonly updateLeaveRequestUseCase: UpdateLeaveRequestUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get all leave records with filters',
    description: 'Retrieve leave records filtered by employee, status, leave type, date range, or department'
  })
  @ApiQuery({ name: 'employee_id', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @ApiQuery({ name: 'leave_type_id', required: false, type: Number })
  @ApiQuery({ name: 'start_date', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, example: '2025-12-31' })
  @ApiQuery({ name: 'department_id', required: false, type: Number })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAll(@Query() filters: GetLeaveRecordsQueryDto): Promise<ApiResponseDto<LeaveRecordResponseDto[]>> {
    const result = await this.getLeaveRecordsUseCase.execute(filters);
    const data = plainToInstance(LeaveRecordResponseDto, result);
    return ApiResponseDto.success(data, 'Leave records retrieved successfully');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get leave record by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Leave record ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Leave record not found' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<LeaveRecordResponseDto>> {
    const result = await this.getLeaveRecordByIdUseCase.execute(id);
    const data = plainToInstance(LeaveRecordResponseDto, result);
    return ApiResponseDto.success(data, 'Leave record retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new leave request',
    description: 'Submit a new leave request. Will check for overlapping leaves and sufficient balance.'
  })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Overlapping leave or insufficient balance' })
  @ApiResponse({ status: 404, description: 'Leave type or balance not found' })
  async create(@Body() dto: CreateLeaveRequestDto): Promise<ApiResponseDto<LeaveRecordResponseDto>> {
    const result = await this.createLeaveRequestUseCase.execute(dto);
    const data = plainToInstance(LeaveRecordResponseDto, result);
    return ApiResponseDto.success(data, 'Leave request created successfully', HttpStatus.CREATED);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update a pending leave request',
    description: 'Only PENDING leave requests can be updated'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Leave record ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Leave is not in PENDING status' })
  @ApiResponse({ status: 404, description: 'Leave record not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeaveRecordDto
  ): Promise<ApiResponseDto<LeaveRecordResponseDto>> {
    const result = await this.updateLeaveRequestUseCase.execute(id, dto);
    const data = plainToInstance(LeaveRecordResponseDto, result);
    return ApiResponseDto.success(data, 'Leave request updated successfully');
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Approve a leave request',
    description: 'Approve a PENDING leave request. Updates balance from pending to used.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Leave record ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Leave is not in PENDING status' })
  @ApiResponse({ status: 404, description: 'Leave record not found' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveLeaveDto
  ): Promise<ApiResponseDto<LeaveRecordResponseDto>> {
    const result = await this.approveLeaveUseCase.execute(id, dto);
    const data = plainToInstance(LeaveRecordResponseDto, result);
    return ApiResponseDto.success(data, 'Leave request approved successfully');
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reject a leave request',
    description: 'Reject a PENDING leave request. Restores balance from pending to remaining.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Leave record ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Leave is not in PENDING status' })
  @ApiResponse({ status: 404, description: 'Leave record not found' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectLeaveDto
  ): Promise<ApiResponseDto<LeaveRecordResponseDto>> {
    const result = await this.rejectLeaveUseCase.execute(id, dto);
    const data = plainToInstance(LeaveRecordResponseDto, result);
    return ApiResponseDto.success(data, 'Leave request rejected successfully');
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancel a leave request',
    description: 'Cancel a PENDING or APPROVED leave request. Cannot cancel if leave has already started. Restores balance accordingly.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Leave record ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Leave cannot be cancelled (already started or wrong status)' })
  @ApiResponse({ status: 404, description: 'Leave record not found' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelLeaveDto
  ): Promise<ApiResponseDto<LeaveRecordResponseDto>> {
    const result = await this.cancelLeaveUseCase.execute(id, dto);
    const data = plainToInstance(LeaveRecordResponseDto, result);
    return ApiResponseDto.success(data, 'Leave request cancelled successfully');
  }
}

