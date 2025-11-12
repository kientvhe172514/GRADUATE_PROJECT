import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthJwtPermissionGuard } from '../guards/auth-jwt-permission.guard';
import { DeviceSessionService } from '../../application/services/device-session.service';
import { ApiResponseDto } from '@graduate-project/shared-common';

@ApiTags('Device Management')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(AuthJwtPermissionGuard)
export class DeviceController {
  constructor(private readonly deviceSessionService: DeviceSessionService) {}

  @Get('my-devices')
  @ApiOperation({ summary: 'Get my devices' })
  @ApiResponse({ status: 200, description: 'Returns list of user devices' })
  async getMyDevices(@Req() req: any) {
    const accountId = req.user.id;
    const devices = await this.deviceSessionService.getAccountDevices(accountId, true);

    return ApiResponseDto.success(devices, 'Devices retrieved successfully');
  }

  @Delete(':deviceId/revoke')
  @ApiOperation({ summary: 'Revoke my device' })
  @ApiParam({ name: 'deviceId', description: 'Device session ID' })
  @ApiResponse({ status: 200, description: 'Device revoked successfully' })
  async revokeMyDevice(@Req() req: any, @Param('deviceId') deviceId: string) {
    const accountId = req.user.id;

    await this.deviceSessionService.revokeDevice(
      parseInt(deviceId),
      accountId,
      'User requested device removal',
    );

    return ApiResponseDto.success(null, 'Device revoked successfully');
  }
}
