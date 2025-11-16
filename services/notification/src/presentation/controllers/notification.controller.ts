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
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { GetUserNotificationsUseCase } from '../../application/use-cases/get-user-notifications.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/mark-notification-as-read.use-case';
import { MarkAllNotificationsAsReadUseCase } from '../../application/use-cases/mark-all-notifications-as-read.use-case';
import { GetMyNotificationStatisticsUseCase } from '../../application/use-cases/get-my-notification-statistics.use-case';
import { GetUnreadCountUseCase } from '../../application/use-cases/get-unread-count.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { SendNotificationFromTemplateDto } from '../../application/dtos/send-notification-from-template.dto';
import { NotificationStatisticsResponseDto, UnreadCountResponseDto } from '../../application/dtos/notification-statistics.dto';
import { SendBulkNotificationDto, BulkMarkAsReadDto, BulkNotificationResponseDto } from '../../application/dtos/bulk-notification.dto';
import { SendNotificationFromTemplateUseCase } from '../../application/use-cases/send-notification-from-template.use-case';
import { SendBulkNotificationUseCase } from '../../application/use-cases/send-bulk-notification.use-case';
import { BulkMarkAsReadUseCase } from '../../application/use-cases/bulk-mark-as-read.use-case';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';
import { DeleteMyReadNotificationsUseCase } from '../../application/use-cases/delete-my-read-notifications.use-case';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

// NOTE: Notification Service is an internal service, authentication is handled by API Gateway/Auth Service
// No JWT validation needed here - trust requests from internal network
@ApiTags('notifications')
@ApiBearerAuth('bearer')
@Controller('')
export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly markAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllNotificationsAsReadUseCase,
    private readonly sendFromTemplateUseCase: SendNotificationFromTemplateUseCase,
    private readonly getMyNotificationStatisticsUseCase: GetMyNotificationStatisticsUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly sendBulkNotificationUseCase: SendBulkNotificationUseCase,
    private readonly bulkMarkAsReadUseCase: BulkMarkAsReadUseCase,
    private readonly deleteMyReadNotificationsUseCase: DeleteMyReadNotificationsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Notification sent successfully',
        data: {
          id: 1,
          recipientId: 123,
          title: 'Leave Request Approved',
          message: 'Your leave request from 2024-01-20 to 2024-01-22 has been approved',
          notificationType: 'LEAVE_APPROVED',
          priority: 'MEDIUM',
          channels: ['IN_APP', 'EMAIL'],
          isRead: false,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  async sendNotification(@Body() dto: SendNotificationDto): Promise<ApiResponseDto<any>> {
    console.log('📨 [POST Notification] Sending notification:', {
      recipientId: dto.recipientId,
      title: dto.title,
      channels: dto.channels,
      notificationType: dto.notificationType,
    });
    
    const notification = await this.sendNotificationUseCase.execute(dto);
    
    console.log('📨 [POST Notification] Notification created:', {
      id: notification.id,
      recipientId: notification.recipientId,
      isRead: notification.isRead,
    });
    
    return ApiResponseDto.success(notification, 'Notification sent successfully', 201);
  }

  @Post('template')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send notification from template' })
  @ApiResponse({
    status: 201,
    description: 'Notification sent from template successfully',
    schema: {
      example: {
        success: true,
        message: 'Notification sent from template successfully',
        data: {
          id: 2,
          recipientId: 123,
          title: 'Welcome to HR System',
          message: 'Hello John Doe, welcome to the company! Your employee ID is EMP001.',
          notificationType: 'SYSTEM_ANNOUNCEMENT',
          priority: 'LOW',
          channels: ['IN_APP', 'EMAIL'],
          isRead: false,
          createdAt: '2024-01-15T10:35:00Z',
          updatedAt: '2024-01-15T10:35:00Z',
        },
      },
    },
  })
  async sendNotificationFromTemplate(
    @Body() dto: SendNotificationFromTemplateDto,
  ): Promise<ApiResponseDto<any>> {
    const notification = await this.sendFromTemplateUseCase.execute(dto);
    return ApiResponseDto.success(notification, 'Notification sent from template successfully', 201);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, example: false })
  @ApiQuery({ 
    name: 'channelFilter', 
    required: false, 
    enum: ChannelType, 
    description: 'Filter notifications by delivery channel (EMAIL, PUSH, SMS, IN_APP, WEB)',
    example: 'WEB' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User notifications retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'User notifications retrieved successfully',
        data: {
          notifications: [
            {
              id: 1,
              type: 'LEAVE_REQUEST_APPROVED',
              title: 'Leave Request Approved',
              message: 'Your leave request has been approved',
              recipientId: 123,
              channels: ['WEB', 'IN_APP'],
              priority: 'MEDIUM',
              isRead: false,
              createdAt: '2024-01-15T10:30:00Z'
            }
          ],
          total: 1,
          unreadCount: 5,
          hasMore: false
        }
      }
    }
  })
  async getUserNotifications(
    @Req() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe)
    unreadOnly: boolean,
    @Query('channelFilter') channelFilter?: ChannelType,
  ): Promise<ApiResponseDto<any>> {
    // Debug logging
    console.log('📋 [GET Notifications] Request Headers:', {
      'x-user-id': req.headers['x-user-id'],
      'x-user-email': req.headers['x-user-email'],
      'x-user-roles': req.headers['x-user-roles'],
      authorization: req.headers['authorization']?.substring(0, 20) + '...',
    });
    console.log('📋 [GET Notifications] req.user:', req.user);
    console.log('📋 [GET Notifications] channelFilter:', channelFilter);

    // Check if user exists (user.sub is the userId from JWT)
    if (!req.user || !req.user.sub) {
      throw new Error('User not authenticated - missing X-User-Id header from Ingress');
    }

    const userId = req.user.sub; // From JWT token via Ingress headers (user.sub = userId)
    console.log('📋 [GET Notifications] Fetching notifications for userId:', userId);

    const result = await this.getUserNotificationsUseCase.execute(userId, {
      limit,
      offset,
      unreadOnly,
      channelFilter,
    });

    console.log('📋 [GET Notifications] Found notifications:', result.total);
    return ApiResponseDto.success(result, 'User notifications retrieved successfully');
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    schema: {
      example: {
        success: true,
        message: 'Notification marked as read',
        data: null,
      },
    },
  })
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: any): Promise<ApiResponseDto<null>> {
    const userId = req.user.sub; // user.sub = userId
    await this.markAsReadUseCase.execute(id, userId);

    return ApiResponseDto.success(null, 'Notification marked as read');
  }

  @Put('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      example: {
        success: true,
        message: 'All notifications marked as read',
        data: null,
      },
    },
  })
  async markAllAsRead(@Req() req: any): Promise<ApiResponseDto<null>> {
    const userId = req.user.sub; // user.sub = userId
    await this.markAllAsReadUseCase.execute(userId);

    return ApiResponseDto.success(null, 'All notifications marked as read');
  }

  @Get('me/statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          total_notifications: 150,
          unread_count: 12,
          read_count: 138,
          read_rate: 92.0,
          by_type: [
            {
              notification_type: 'LEAVE_REQUEST_APPROVED',
              total: 15,
              unread: 3,
            },
            {
              notification_type: 'ATTENDANCE_REMINDER',
              total: 50,
              unread: 5,
            },
          ],
          by_channel: [
            {
              channel: 'PUSH',
              sent: 45,
              delivered: 42,
              failed: 3,
            },
            {
              channel: 'EMAIL',
              sent: 30,
              delivered: 29,
              failed: 1,
            },
          ],
          recent_notifications: [
            {
              id: 123,
              title: 'Leave Request Approved',
              notification_type: 'LEAVE_REQUEST_APPROVED',
              is_read: false,
              created_at: '2024-11-16T09:30:00Z',
            },
          ],
        },
        message: 'Notification statistics retrieved successfully',
        statusCode: 200,
      },
    },
  })
  async getMyNotificationStatistics(
    @Req() req: any,
  ): Promise<ApiResponseDto<NotificationStatisticsResponseDto>> {
    if (!req.user || !req.user.sub) {
      throw new Error('User not authenticated - missing X-User-Id header from Ingress');
    }

    const userId = req.user.sub;
    const statistics = await this.getMyNotificationStatisticsUseCase.execute(userId);

    return ApiResponseDto.success(statistics, 'Notification statistics retrieved successfully');
  }

  @Get('me/unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          unread_count: 12,
          by_type: [
            { type: 'LEAVE_REQUEST_APPROVED', count: 3 },
            { type: 'ATTENDANCE_REMINDER', count: 5 },
            { type: 'SYSTEM_ANNOUNCEMENT', count: 4 },
          ],
        },
        message: 'Unread count retrieved successfully',
        statusCode: 200,
      },
    },
  })
  async getMyUnreadCount(@Req() req: any): Promise<ApiResponseDto<UnreadCountResponseDto>> {
    if (!req.user || !req.user.sub) {
      throw new Error('User not authenticated - missing X-User-Id header from Ingress');
    }

    const userId = req.user.sub;
    const unreadCount = await this.getUnreadCountUseCase.execute(userId);

    return ApiResponseDto.success(unreadCount, 'Unread count retrieved successfully');
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send bulk notification to multiple recipients' })
  @ApiResponse({
    status: 201,
    description: 'Bulk notification sent successfully',
    schema: {
      example: {
        success: true,
        data: {
          sent_count: 45,
          recipient_count: 45,
          recipient_ids: [1, 2, 3, 4, 5],
        },
        message: 'Bulk notification sent successfully',
        statusCode: 201,
      },
    },
  })
  async sendBulkNotification(
    @Body() dto: SendBulkNotificationDto,
  ): Promise<ApiResponseDto<BulkNotificationResponseDto>> {
    const result = await this.sendBulkNotificationUseCase.execute(dto);
    return ApiResponseDto.success(result, 'Bulk notification sent successfully', 201);
  }

  @Put('bulk/mark-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read',
    schema: {
      example: {
        success: true,
        data: {
          marked_count: 5,
        },
        message: 'Notifications marked as read successfully',
        statusCode: 200,
      },
    },
  })
  async bulkMarkAsRead(
    @Body() dto: BulkMarkAsReadDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<{ marked_count: number }>> {
    if (!req.user || !req.user.sub) {
      throw new Error('User not authenticated - missing X-User-Id header from Ingress');
    }

    const userId = req.user.sub;
    const result = await this.bulkMarkAsReadUseCase.execute(dto, userId);

    return ApiResponseDto.success(result, 'Notifications marked as read successfully');
  }

  @Delete('me/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all my read notifications' })
  @ApiResponse({
    status: 200,
    description: 'Read notifications deleted',
    schema: {
      example: {
        success: true,
        data: {
          deleted_count: 25,
        },
        message: 'Read notifications deleted successfully',
        statusCode: 200,
      },
    },
  })
  async deleteMyReadNotifications(
    @Req() req: any,
  ): Promise<ApiResponseDto<{ deleted_count: number }>> {
    if (!req.user || !req.user.sub) {
      throw new Error('User not authenticated - missing X-User-Id header from Ingress');
    }

    const userId = req.user.sub;
    const result = await this.deleteMyReadNotificationsUseCase.execute(userId);

    return ApiResponseDto.success(result, 'Read notifications deleted successfully');
  }
}
