import {
  Body,
  Controller,
  Get,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Permissions } from '@graduate-project/shared-common';
import { UpdateNotificationPreferenceUseCase } from '../../application/use-cases/update-notification-preference.use-case';
import { GetNotificationPreferencesUseCase } from '../../application/use-cases/get-notification-preferences.use-case';
import { UpdateNotificationPreferenceDto } from '../../application/dtos/update-notification-preference.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('preferences')
@ApiBearerAuth('bearer')
@Controller('notification-preferences')
export class NotificationPreferenceController {
  constructor(
    private readonly updatePreferenceUseCase: UpdateNotificationPreferenceUseCase,
    private readonly getPreferencesUseCase: GetNotificationPreferencesUseCase,
  ) {}

  @Get()
  @Permissions('notification.preference.read_own')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: {
          id: 1,
          employeeId: 123,
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          inAppEnabled: true,
          doNotDisturbStart: '22:00',
          doNotDisturbEnd: '07:00',
          preferredChannels: ['EMAIL', 'IN_APP'],
        },
      },
    },
  })
  async getPreferences(@CurrentUser() user: JwtPayload): Promise<ApiResponseDto<any>> {
    const userId = user.sub;
    const preferences = await this.getPreferencesUseCase.execute(userId);

    return ApiResponseDto.success(preferences, 'Notification preferences retrieved successfully');
  }

  @Put()
  @Permissions('notification.preference.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update notification preferences',
    description: `Update user notification preferences for a specific notification type. 
    
    Users can customize how they receive notifications by enabling/disabling different channels:
    - **emailEnabled**: Receive notifications via email
    - **pushEnabled**: Receive push notifications on mobile devices
    - **smsEnabled**: Receive SMS text messages
    - **inAppEnabled**: See notifications in the application
    
    You can also set Do Not Disturb hours to prevent notifications during specific time periods.
    
    **Note**: The employeeId is automatically set from the JWT token, so you don't need to provide it in the request body.`
  })
  @ApiBody({
    type: UpdateNotificationPreferenceDto,
    description: 'Notification preference settings',
    examples: {
      'Enable all channels': {
        value: {
          notificationType: 'LEAVE_REQUEST_APPROVED',
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          inAppEnabled: true,
        },
        description: 'Enable email, push, and in-app notifications for leave approvals'
      },
      'With Do Not Disturb': {
        value: {
          notificationType: 'ATTENDANCE_REMINDER',
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          doNotDisturbStart: '22:00',
          doNotDisturbEnd: '07:00',
        },
        description: 'Enable notifications with DND from 10 PM to 7 AM'
      },
      'Push only': {
        value: {
          notificationType: 'OVERTIME_REQUEST_STATUS',
          emailEnabled: false,
          pushEnabled: true,
          smsEnabled: false,
          inAppEnabled: false,
        },
        description: 'Only receive push notifications for overtime updates'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Notification preferences updated successfully',
        data: {
          id: 1,
          employeeId: 123,
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          inAppEnabled: true,
          doNotDisturbStart: '22:00',
          doNotDisturbEnd: '07:00',
          preferredChannels: ['EMAIL', 'IN_APP', 'PUSH'],
        },
      },
    },
  })
  async updatePreference(
    @Body() dto: UpdateNotificationPreferenceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<any>> {
    // Ensure user can only update their own preferences
    dto.employeeId = user.sub;

    const preference = await this.updatePreferenceUseCase.execute(dto);

    return ApiResponseDto.success(preference, 'Notification preferences updated successfully');
  }
}
