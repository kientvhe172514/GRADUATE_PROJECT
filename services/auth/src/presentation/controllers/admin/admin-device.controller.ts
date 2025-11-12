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
import { AuthJwtPermissionGuard } from '../../guards/auth-jwt-permission.guard';
import { AuthPermissions } from '../../decorators/auth-permissions.decorator';
import { DeviceSessionService } from '../../../application/services/device-session.service';
import { DeviceActivityLogRepositoryPort } from '../../../application/ports/device-activity-log.repository.port';
import { DeviceSecurityAlertRepositoryPort } from '../../../application/ports/device-security-alert.repository.port';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { Inject } from '@nestjs/common';
import {
  DEVICE_ACTIVITY_LOG_REPOSITORY,
  DEVICE_SECURITY_ALERT_REPOSITORY,
} from '../../../application/tokens';

class RevokeDeviceDto {
  reason: string;
}

class ResolveAlertDto {
  resolution_note?: string;
}

@ApiTags('Admin - Device Management')
@ApiBearerAuth()
@Controller('admin/devices')
@UseGuards(AuthJwtPermissionGuard)
export class AdminDeviceController {
  constructor(
    private readonly deviceSessionService: DeviceSessionService,
    @Inject(DEVICE_ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogRepo: DeviceActivityLogRepositoryPort,
    @Inject(DEVICE_SECURITY_ALERT_REPOSITORY)
    private readonly securityAlertRepo: DeviceSecurityAlertRepositoryPort,
  ) {}

  @Get('accounts/:accountId')
  @AuthPermissions('view:accounts', 'manage:accounts')
  @ApiOperation({ summary: 'Get account devices', description: 'Admin can view all devices for an account' })
  @ApiParam({ name: 'accountId', description: 'Account ID', type: 'number' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Filter active devices only' })
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
  @AuthPermissions('manage:accounts')
  @ApiOperation({ summary: 'Revoke device', description: 'Admin can revoke any device' })
  @ApiParam({ name: 'deviceId', description: 'Device session ID', type: 'number' })
  @ApiBody({ type: RevokeDeviceDto })
  @ApiResponse({ status: 200, description: 'Device revoked successfully' })
  async revokeDevice(
    @Param('deviceId') deviceId: string,
    @Body() dto: RevokeDeviceDto,
  ) {
    await this.deviceSessionService.revokeDevice(
      parseInt(deviceId),
      0, // System/Admin action
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
  @AuthPermissions('view:accounts', 'manage:security')
  @ApiOperation({ summary: 'Get suspicious activities', description: 'View suspicious device activities for security monitoring' })
  @ApiParam({ name: 'accountId', description: 'Account ID', type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of records', example: 50 })
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
  @AuthPermissions('manage:security')
  @ApiOperation({ summary: 'Get all pending security alerts', description: 'View all pending security alerts across all accounts' })
  @ApiResponse({ status: 200, description: 'Returns pending security alerts' })
  async getPendingAlerts() {
    const alerts = await this.securityAlertRepo.findPendingAlerts();

    return ApiResponseDto.success(alerts, 'Security alerts retrieved successfully');
  }

  @Get('security-alerts/:accountId')
  @AuthPermissions('view:accounts', 'manage:security')
  @ApiOperation({ summary: 'Get account security alerts', description: 'View security alerts for a specific account' })
  @ApiParam({ name: 'accountId', description: 'Account ID', type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of records', example: 50 })
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
  @AuthPermissions('manage:security')
  @ApiOperation({ summary: 'Resolve security alert', description: 'Mark security alert as resolved' })
  @ApiParam({ name: 'alertId', description: 'Alert ID', type: 'number' })
  @ApiBody({ type: ResolveAlertDto })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Body() dto: ResolveAlertDto,
  ) {
    const { AlertStatus } = await import('../../../domain/entities/device-security-alert.entity');
    await this.securityAlertRepo.updateStatus(parseInt(alertId), AlertStatus.RESOLVED, 0);

    return ApiResponseDto.success(null, 'Alert resolved successfully');
  }

  @Get('statistics')
  @AuthPermissions('view:statistics')
  @ApiOperation({ summary: 'Get device statistics', description: 'Get overall device and security statistics' })
  @ApiResponse({ status: 200, description: 'Returns device statistics' })
  async getDeviceStatistics() {
    // TODO: Implement statistics aggregation
    const stats = {
      total_devices: 0,
      active_devices: 0,
      suspicious_devices: 0,
      pending_alerts: 0,
      critical_alerts: 0,
    };

    return ApiResponseDto.success(stats, 'Statistics retrieved successfully');
  }
}
