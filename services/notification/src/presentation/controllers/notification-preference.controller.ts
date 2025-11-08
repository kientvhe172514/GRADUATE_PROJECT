import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences retrieved successfully' })
  async getPreferences(@Req() req: any): Promise<ApiResponseDto<any>> {
    const userId = req.user.sub; // user.sub = userId
    const preferences = await this.getPreferencesUseCase.execute(userId);

    return ApiResponseDto.success(preferences, 'Notification preferences retrieved successfully');
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences updated successfully' })
  async updatePreference(
    @Body() dto: UpdateNotificationPreferenceDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    // Ensure user can only update their own preferences
    dto.employeeId = req.user.sub; // user.sub = userId

    const preference = await this.updatePreferenceUseCase.execute(dto);

    return ApiResponseDto.success(preference, 'Notification preferences updated successfully');
  }
}
