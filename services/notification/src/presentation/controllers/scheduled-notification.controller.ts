import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CreateScheduledNotificationUseCase } from '../../application/use-cases/create-scheduled-notification.use-case';
import { UpdateScheduledNotificationUseCase } from '../../application/use-cases/update-scheduled-notification.use-case';
import { CancelScheduledNotificationUseCase } from '../../application/use-cases/cancel-scheduled-notification.use-case';
import { GetScheduledNotificationsUseCase } from '../../application/use-cases/get-scheduled-notifications.use-case';
import {
  CreateScheduledNotificationDto,
  UpdateScheduledNotificationDto,
  ScheduledNotificationResponseDto,
} from '../../application/dtos/scheduled-notification.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('scheduled-notifications')
@ApiBearerAuth('bearer')
@Controller('scheduled')
export class ScheduledNotificationController {
  constructor(
    private readonly createScheduledNotificationUseCase: CreateScheduledNotificationUseCase,
    private readonly updateScheduledNotificationUseCase: UpdateScheduledNotificationUseCase,
    private readonly cancelScheduledNotificationUseCase: CancelScheduledNotificationUseCase,
    private readonly getScheduledNotificationsUseCase: GetScheduledNotificationsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a scheduled notification' })
  @ApiResponse({
    status: 201,
    description: 'Scheduled notification created successfully',
    schema: {
      example: {
        success: true,
        message: 'Scheduled notification created successfully',
        data: {
          id: 1,
          schedule_type: 'ONCE',
          recipient_type: 'INDIVIDUAL',
          recipient_ids: [101, 102],
          title: 'System Maintenance Notice',
          message: 'System maintenance is scheduled for tonight at 10 PM',
          notification_type: 'SYSTEM_ANNOUNCEMENT',
          channels: ['IN_APP', 'EMAIL'],
          scheduled_at: '2024-12-31T22:00:00Z',
          timezone: 'Asia/Ho_Chi_Minh',
          status: 'ACTIVE',
          next_run_at: '2024-12-31T22:00:00Z',
          created_by: 1,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  async createScheduledNotification(
    @Req() req: any,
    @Body() dto: CreateScheduledNotificationDto,
  ): Promise<ApiResponseDto<ScheduledNotificationResponseDto>> {
    const userId = req.user.sub;
    const scheduled = await this.createScheduledNotificationUseCase.execute(dto, userId);
    return ApiResponseDto.success(
      ScheduledNotificationResponseDto.fromEntity(scheduled),
      'Scheduled notification created successfully',
      201,
    );
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my scheduled notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
    example: 'ACTIVE',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled notifications retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Scheduled notifications retrieved successfully',
        data: {
          notifications: [
            {
              id: 1,
              schedule_type: 'RECURRING',
              recipient_type: 'ALL_EMPLOYEES',
              title: 'Daily Standup Reminder',
              message: 'Daily standup meeting starts in 15 minutes',
              notification_type: 'MEETING_REMINDER',
              channels: ['IN_APP', 'PUSH'],
              cron_expression: '0 9 * * 1-5',
              timezone: 'Asia/Ho_Chi_Minh',
              status: 'ACTIVE',
              next_run_at: '2024-01-16T09:00:00Z',
              last_run_at: '2024-01-15T09:00:00Z',
              created_by: 1,
              created_at: '2024-01-01T10:30:00Z',
              updated_at: '2024-01-15T09:00:00Z',
            },
          ],
          total: 1,
        },
      },
    },
  })
  async getMyScheduledNotifications(
    @Req() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('status') status?: string,
  ): Promise<ApiResponseDto<any>> {
    const userId = req.user.sub;
    const result = await this.getScheduledNotificationsUseCase.execute(userId, {
      limit,
      offset,
      status,
    });

    return ApiResponseDto.success(
      {
        notifications: result.notifications.map(ScheduledNotificationResponseDto.fromEntity),
        total: result.total,
      },
      'Scheduled notifications retrieved successfully',
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a scheduled notification' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Scheduled notification updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Scheduled notification updated successfully',
        data: {
          id: 1,
          schedule_type: 'ONCE',
          recipient_type: 'INDIVIDUAL',
          recipient_ids: [101, 102, 103],
          title: 'Updated System Maintenance Notice',
          message: 'System maintenance rescheduled to tomorrow at 10 PM',
          notification_type: 'SYSTEM_ANNOUNCEMENT',
          channels: ['IN_APP', 'EMAIL', 'PUSH'],
          scheduled_at: '2025-01-01T22:00:00Z',
          timezone: 'Asia/Ho_Chi_Minh',
          status: 'ACTIVE',
          next_run_at: '2025-01-01T22:00:00Z',
          created_by: 1,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T14:00:00Z',
        },
      },
    },
  })
  async updateScheduledNotification(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduledNotificationDto,
  ): Promise<ApiResponseDto<ScheduledNotificationResponseDto>> {
    const userId = req.user.sub;
    const scheduled = await this.updateScheduledNotificationUseCase.execute(id, dto, userId);
    return ApiResponseDto.success(
      ScheduledNotificationResponseDto.fromEntity(scheduled),
      'Scheduled notification updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a scheduled notification' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Scheduled notification cancelled successfully',
    schema: {
      example: {
        success: true,
        message: 'Scheduled notification cancelled successfully',
        data: null,
      },
    },
  })
  async cancelScheduledNotification(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<null>> {
    const userId = req.user.sub;
    await this.cancelScheduledNotificationUseCase.execute(id, userId);
    return ApiResponseDto.success(null, 'Scheduled notification cancelled successfully');
  }
}
