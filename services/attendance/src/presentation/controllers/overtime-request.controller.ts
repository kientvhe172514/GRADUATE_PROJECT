import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../infrastructure/repositories/overtime-request.repository';
import {
  CreateOvertimeRequestDto,
  UpdateOvertimeRequestDto,
  ApproveOvertimeDto,
  RejectOvertimeDto,
  OvertimeQueryDto,
} from '../dtos/overtime-request.dto';

@ApiTags('Overtime Requests')
@Controller('overtime-requests')
export class OvertimeRequestController {
  constructor(
    private readonly overtimeRepository: OvertimeRequestRepository,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create overtime request (Employee)' })
  @ApiResponse({ status: 201, description: 'OT request created successfully' })
  async createRequest(
    @Body() dto: CreateOvertimeRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const request = await this.overtimeRepository.createRequest({
      employee_id: user.employee_id!,
      shift_id: dto.shift_id,
      overtime_date: new Date(dto.overtime_date),
      start_time: new Date(dto.start_time),
      end_time: new Date(dto.end_time),
      estimated_hours: dto.estimated_hours,
      reason: dto.reason,
      requested_by: user.employee_id!,
    });

    // Emit notification event
    this.notificationClient.emit('overtime.requested', {
      employee_id: user.employee_id!,
      overtime_date: dto.overtime_date,
      estimated_hours: dto.estimated_hours,
    });

    return {
      success: true,
      message: 'Overtime request submitted successfully',
      data: request,
    };
  }

  @Get('my-requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my overtime requests (Employee)' })
  @ApiResponse({
    status: 200,
    description: 'Your OT requests retrieved successfully',
  })
  async getMyRequests(
    @CurrentUser() user: JwtPayload,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    const requests = await this.overtimeRepository.findByEmployeeId(
      user.employee_id!,
      limit,
      offset,
    );

    return {
      success: true,
      message: 'Your overtime requests retrieved successfully',
      data: requests,
      pagination: {
        limit,
        offset,
        total: requests.length,
      },
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all overtime requests (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'OT requests retrieved successfully',
  })
  async getAllRequests(@Query() query: OvertimeQueryDto) {
    const requests = query.status
      ? await this.overtimeRepository.findByStatus(
          query.status,
          query.limit ?? 50,
          query.offset ?? 0,
        )
      : await this.overtimeRepository.find({
          take: query.limit ?? 50,
          skip: query.offset ?? 0,
          order: { created_at: 'DESC' },
        });

    return {
      success: true,
      message: 'Overtime requests retrieved successfully',
      data: requests,
      pagination: {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
        total: requests.length,
      },
    };
  }

  @Get('pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pending overtime requests (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Pending OT requests retrieved successfully',
  })
  async getPendingRequests(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    const requests = await this.overtimeRepository.findPendingRequests(
      limit,
      offset,
    );

    return {
      success: true,
      message: 'Pending overtime requests retrieved successfully',
      data: requests,
      pagination: {
        limit,
        offset,
        total: requests.length,
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get overtime request details' })
  @ApiResponse({
    status: 200,
    description: 'OT request retrieved successfully',
  })
  async getRequestById(@Param('id', ParseIntPipe) id: number) {
    const request = await this.overtimeRepository.findOne({ where: { id } });

    if (!request) {
      return {
        success: false,
        message: 'Overtime request not found',
      };
    }

    return {
      success: true,
      message: 'Overtime request retrieved successfully',
      data: request,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update overtime request (Employee - before approval)',
  })
  @ApiResponse({ status: 200, description: 'OT request updated successfully' })
  async updateRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOvertimeRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Check if request belongs to user and is still pending
    const request = await this.overtimeRepository.findOne({ where: { id } });

    if (!request) {
      return {
        success: false,
        message: 'Overtime request not found',
      };
    }

    if (request.employee_id !== user.employee_id!) {
      return {
        success: false,
        message: 'You can only update your own requests',
      };
    }

    if (request.status !== 'PENDING') {
      return {
        success: false,
        message: 'Cannot update request that is already approved/rejected',
      };
    }

    // Convert string dates to Date objects for schema
    const updateData = {
      ...dto,
      start_time: dto.start_time ? new Date(dto.start_time) : undefined,
      end_time: dto.end_time ? new Date(dto.end_time) : undefined,
    };

    const updated = await this.overtimeRepository.updateRequest(
      id,
      updateData as any,
    );

    return {
      success: updated,
      message: updated
        ? 'Overtime request updated successfully'
        : 'Update failed',
    };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve overtime request (HR/Manager)' })
  @ApiResponse({ status: 200, description: 'OT request approved successfully' })
  async approveRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const approved = await this.overtimeRepository.approveRequest(
      id,
      user.employee_id!,
    );

    if (!approved) {
      return {
        success: false,
        message: 'Overtime request not found or approval failed',
      };
    }

    // Get request details for notification
    const request = await this.overtimeRepository.findOne({ where: { id } });

    if (request) {
      this.notificationClient.emit('overtime.approved', {
        employee_id: request.employee_id,
        overtime_date: request.overtime_date,
        estimated_hours: request.estimated_hours,
      });
    }

    return {
      success: true,
      message: 'Overtime request approved successfully',
    };
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject overtime request (HR/Manager)' })
  @ApiResponse({ status: 200, description: 'OT request rejected successfully' })
  async rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectOvertimeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const rejected = await this.overtimeRepository.rejectRequest(
      id,
      user.employee_id!,
      dto.rejection_reason || 'No reason provided',
    );

    if (!rejected) {
      return {
        success: false,
        message: 'Overtime request not found or rejection failed',
      };
    }

    return {
      success: true,
      message: 'Overtime request rejected successfully',
    };
  }
}
