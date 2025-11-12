import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { DeviceSessionService } from '../../application/services/device-session.service';
import { DeviceActivityLogRepositoryPort } from '../../application/ports/device-activity-log.repository.port';
import { DeviceSecurityAlertRepositoryPort } from '../../application/ports/device-security-alert.repository.port';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { Inject } from '@nestjs/common';
import {
  DEVICE_ACTIVITY_LOG_REPOSITORY,
  DEVICE_SECURITY_ALERT_REPOSITORY,
} from '../../application/tokens';

class RevokeDeviceDto {
  reason: string;
}

@ApiTags('Admin - Device Management')
@ApiBearerAuth()
@Controller('admin/devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminDeviceController {
  constructor(
    private readonly deviceSessionService: DeviceSessionService,
    @Inject(DEVICE_ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogRepo: DeviceActivityLogRepositoryPort,
    @Inject(DEVICE_SECURITY_ALERT_REPOSITORY)
    private readonly securityAlertRepo: DeviceSecurityAlertRepositoryPort,
  ) {}

  @Get('accounts/:accountId')
  @ApiOperation({ summary: 'Get account devices' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns list of account devices' })
  async getAccountDevices(
    @Param('accountId') accountId: string,
    @Query('activeOnly') activeOnly: boolean = false,
  ) {
    const devices = await this.deviceSessionService.getAccountDevices(
      parseInt(accountId),
      activeOnly,
    );

    return ApiResponseDto.success(devices, 'Devices retrieved successfully');
  }

  @Post(':deviceId/revoke')
  @ApiOperation({ summary: 'Revoke device' })
  @ApiParam({ name: 'deviceId', description: 'Device session ID' })
  @ApiBody({ type: RevokeDeviceDto })
  @ApiResponse({ status: 200, description: 'Device revoked successfully' })
  async revokeDevice(
    @Param('deviceId') deviceId: string,
    @Body() dto: RevokeDeviceDto,
  ) {
    await this.deviceSessionService.revokeDevice(
      parseInt(deviceId),
      0, // Admin action
      dto.reason || 'Revoked by admin',
    );

    return ApiResponseDto.success(null, 'Device revoked successfully');
  }

  @Get('activities/:accountId')
  @ApiOperation({ summary: 'Get account device activities' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns device activities' })
  async getAccountActivities(
    @Param('accountId') accountId: string,
    @Query('limit') limit: number = 50,
  ) {
    const activities = await this.activityLogRepo.findByAccountId(
      parseInt(accountId),
      limit,
    );

    return ApiResponseDto.success(activities, 'Activities retrieved successfully');
  }

  @Get('suspicious-activities/:accountId')
  @ApiOperation({ summary: 'Get suspicious activities' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns suspicious activities' })
  async getSuspiciousActivities(
    @Param('accountId') accountId: string,
    @Query('limit') limit: number = 50,
  ) {
    const activities = await this.activityLogRepo.findSuspiciousActivities(
      parseInt(accountId),
      limit,
    );

    return ApiResponseDto.success(
      activities,
      'Suspicious activities retrieved successfully',
    );
  }

  @Get('security-alerts')
  @ApiOperation({ summary: 'Get all pending security alerts' })
  @ApiResponse({ status: 200, description: 'Returns pending security alerts' })
  async getPendingAlerts() {
    const alerts = await this.securityAlertRepo.findPendingAlerts();

    return ApiResponseDto.success(alerts, 'Security alerts retrieved successfully');
  }

  @Get('security-alerts/:accountId')
  @ApiOperation({ summary: 'Get account security alerts' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns account security alerts' })
  async getAccountAlerts(
    @Param('accountId') accountId: string,
    @Query('limit') limit: number = 50,
  ) {
    const alerts = await this.securityAlertRepo.findByAccountId(
      parseInt(accountId),
      limit,
    );

    return ApiResponseDto.success(alerts, 'Security alerts retrieved successfully');
  }

  @Post('security-alerts/:alertId/resolve')
  @ApiOperation({ summary: 'Resolve security alert' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  async resolveAlert(@Param('alertId') alertId: string) {
    await this.securityAlertRepo.updateStatus(parseInt(alertId), 'RESOLVED', 0);

    return ApiResponseDto.success(null, 'Alert resolved successfully');
  }
}
