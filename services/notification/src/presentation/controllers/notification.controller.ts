import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { GetUserNotificationsUseCase } from '../../application/use-cases/get-user-notifications.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/mark-notification-as-read.use-case';
import { MarkAllNotificationsAsReadUseCase } from '../../application/use-cases/mark-all-notifications-as-read.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { SendNotificationFromTemplateDto } from '../../application/dtos/send-notification-from-template.dto';
import { SendNotificationFromTemplateUseCase } from '../../application/use-cases/send-notification-from-template.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly markAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllNotificationsAsReadUseCase,
    private readonly sendFromTemplateUseCase: SendNotificationFromTemplateUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Send a notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    const notification = await this.sendNotificationUseCase.execute(dto);
    return {
      success: true,
      data: notification,
    };
  }

  @Post('template')
  @ApiOperation({ summary: 'Send notification from template' })
  @ApiResponse({ status: 201, description: 'Notification sent from template successfully' })
  async sendNotificationFromTemplate(
    @Body() dto: SendNotificationFromTemplateDto,
  ) {
    const notification = await this.sendFromTemplateUseCase.execute(dto);
    return {
      success: true,
      data: notification,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, example: false })
  @ApiResponse({ status: 200, description: 'User notifications retrieved successfully' })
  async getUserNotifications(
    @Req() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe)
    unreadOnly: boolean,
  ) {
    const userId = req.user.id; // From JWT token

    const result = await this.getUserNotificationsUseCase.execute(userId, {
      limit,
      offset,
      unreadOnly,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.id;
    await this.markAsReadUseCase.execute(id, userId);

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.id;
    await this.markAllAsReadUseCase.execute(userId);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }
}
