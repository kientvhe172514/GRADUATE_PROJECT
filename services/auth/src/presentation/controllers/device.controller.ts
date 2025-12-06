import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthPermissions } from '../decorators/auth-permissions.decorator';
import { GetMyDevicesUseCase } from '../../application/use-cases/device/get-my-devices.use-case';
import { RevokeDeviceUseCase } from '../../application/use-cases/device/revoke-device.use-case';
import { GetDeviceActivitiesUseCase } from '../../application/use-cases/device/get-device-activities.use-case';
import { GetAllDevicesUseCase } from '../../application/use-cases/device/get-all-devices.use-case';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
export class DeviceController {
  constructor(
    private getMyDevicesUseCase: GetMyDevicesUseCase,
    private revokeDeviceUseCase: RevokeDeviceUseCase,
    private getDeviceActivitiesUseCase: GetDeviceActivitiesUseCase,
    private getAllDevicesUseCase: GetAllDevicesUseCase,
  ) {}

  @Get('my-devices')
  @AuthPermissions('auth.device.read_own')
  @ApiOperation({ summary: 'Get my registered devices' })
  @ApiResponse({
    status: 200,
    description: 'Devices retrieved successfully',
  })
  async getMyDevices(@CurrentUser() user: any) {
    return await this.getMyDevicesUseCase.execute(user.sub);
  }

  @Delete(':id/revoke')
  @AuthPermissions('auth.device.delete')
  @ApiOperation({ summary: 'Revoke a specific device' })
  @ApiResponse({
    status: 200,
    description: 'Device revoked successfully',
  })
  async revokeDevice(
    @Param('id', ParseIntPipe) deviceId: number,
    @CurrentUser() user: any,
  ) {
    return await this.revokeDeviceUseCase.execute(
      deviceId,
      user.sub,
      user.sub,
      'Revoked by user',
    );
  }

  @Get('my-activities')
  @AuthPermissions('auth.device.read_own')
  @ApiOperation({ summary: 'Get my device activities' })
  @ApiResponse({
    status: 200,
    description: 'Activities retrieved successfully',
  })
  async getMyActivities(
    @CurrentUser() user: any,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return await this.getDeviceActivitiesUseCase.execute(user.sub, limit);
  }

  @Get()
  @AuthPermissions('auth.device.read')
  @ApiOperation({ summary: 'Get all devices (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'All devices retrieved successfully',
  })
  async getAllDevices(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.getAllDevicesUseCase.execute(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }
}
