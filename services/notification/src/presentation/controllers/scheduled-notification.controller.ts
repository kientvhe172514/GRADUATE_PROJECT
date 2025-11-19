import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Permissions } from '@graduate-project/shared-common';
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
  @Permissions('notification.schedule.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a scheduled notification',
    description: 'Schedule a notification to be sent at a specific time or on a recurring basis. Supports one-time notifications, recurring notifications (using cron expressions), and notifications to individuals, groups, or all employees.'
  })
  @ApiBody({
    type: CreateScheduledNotificationDto,
    description: 'Scheduled notification configuration',
    examples: {
      oneTime: {
        summary: 'One-time System Maintenance Notice',
        value: {
          scheduleType: 'ONCE',
          recipientType: 'ALL_EMPLOYEES',
          title: 'System Maintenance Tonight',
          message: 'System will be down for maintenance tonight from 10 PM to 2 AM',
          notificationType: 'SYSTEM_ANNOUNCEMENT',
          channels: ['IN_APP', 'EMAIL', 'PUSH'],
          scheduledAt: '2024-12-31T22:00:00Z',
          timezone: 'Asia/Ho_Chi_Minh'
        }
      },
      recurring: {
        summary: 'Daily Standup Reminder (Mon-Fri at 9 AM)',
        value: {
          scheduleType: 'RECURRING',
          recipientType: 'SPECIFIC_GROUP',
          recipientIds: [101, 102, 103],
          title: 'Daily Standup in 15 minutes',
          message: 'Don\'t forget the daily standup meeting at 9:15 AM',
          notificationType: 'MEETING_REMINDER',
          channels: ['IN_APP', 'PUSH'],
          cronExpression: '0 9 * * 1-5',
          timezone: 'Asia/Ho_Chi_Minh'
        }
      }
    }
  })
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
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateScheduledNotificationDto,
  ): Promise<ApiResponseDto<ScheduledNotificationResponseDto>> {
    const userId = user.sub;
    const scheduled = await this.createScheduledNotificationUseCase.execute(dto, userId);
    return ApiResponseDto.success(
      ScheduledNotificationResponseDto.fromEntity(scheduled),
      'Scheduled notification created successfully',
      201,
    );
  }

  @Get('me')
  @Permissions('notification.schedule.read_own')
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
    @CurrentUser() user: JwtPayload,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('status') status?: string,
  ): Promise<ApiResponseDto<any>> {
    const userId = user.sub;
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
  @Permissions('notification.schedule.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a scheduled notification',
    description: 'Update an existing scheduled notification. You can change the title, message, recipients, schedule time, or any other properties. Only the creator of the scheduled notification can update it.'
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    type: UpdateScheduledNotificationDto,
    description: 'Updated scheduled notification properties',
    examples: {
      reschedule: {
        summary: 'Reschedule to different time',
        value: {
          scheduledAt: '2025-01-15T22:00:00Z',
          title: 'Updated: System Maintenance Rescheduled',
          message: 'System maintenance has been rescheduled to January 15 at 10 PM'
        }
      },
      updateRecipients: {
        summary: 'Add more recipients',
        value: {
          recipientIds: [101, 102, 103, 104, 105, 106],
          title: 'Department Meeting (Updated)'
        }
      },
      pauseSchedule: {
        summary: 'Pause scheduled notification',
        value: {
          status: 'PAUSED'
        }
      }
    }
  })
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
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduledNotificationDto,
  ): Promise<ApiResponseDto<ScheduledNotificationResponseDto>> {
    const userId = user.sub;
    const scheduled = await this.updateScheduledNotificationUseCase.execute(id, dto, userId);
    return ApiResponseDto.success(
      ScheduledNotificationResponseDto.fromEntity(scheduled),
      'Scheduled notification updated successfully',
    );
  }

  @Delete(':id')
  @Permissions('notification.schedule.delete')
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
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<null>> {
    const userId = user.sub;
    await this.cancelScheduledNotificationUseCase.execute(id, userId);
    return ApiResponseDto.success(null, 'Scheduled notification cancelled successfully');
  }
}
