import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtPayload,
  Permissions,
  Public,
} from '@graduate-project/shared-common';
import { BeaconRepository } from '../../infrastructure/repositories/beacon.repository';
import {
  CreateBeaconDto,
  UpdateBeaconDto,
  BeaconQueryDto,
} from '../dtos/beacon.dto';

@ApiTags('Beacons')
@ApiBearerAuth()
@Public()
@Controller('beacons')
export class BeaconController {
  constructor(private readonly beaconRepository: BeaconRepository) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new beacon (HR/Admin only)' })
  @ApiResponse({ status: 201, description: 'Beacon registered successfully' })
  async createBeacon(
    @Body() dto: CreateBeaconDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Check if beacon already exists
    const existing = await this.beaconRepository.findByUUID(
      dto.beacon_uuid,
      dto.beacon_major,
      dto.beacon_minor,
    );

    if (existing) {
      return {
        success: false,
        message: 'Beacon with same UUID/Major/Minor already exists',
      };
    }

    const beacon = await this.beaconRepository.createBeacon(
      {
        ...dto,
        signal_range_meters: dto.signal_range_meters ?? 30,
        rssi_threshold: dto.rssi_threshold ?? -70,
        status: 'ACTIVE',
      },
      user.employee_id!,
    );

    return {
      success: true,
      message: 'Beacon registered successfully',
      data: beacon,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all beacons' })
  @ApiResponse({ status: 200, description: 'Beacons retrieved successfully' })
  async getBeacons(@Query() query: BeaconQueryDto) {
    const beacons = await this.beaconRepository.findAllBeacons(
      query.department_id,
      query.status,
      query.limit ?? 50,
      query.offset ?? 0,
    );

    return {
      success: true,
      message: 'Beacons retrieved successfully',
      data: beacons,
      pagination: {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
        total: beacons.length,
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get beacon by ID' })
  @ApiResponse({ status: 200, description: 'Beacon retrieved successfully' })
  async getBeaconById(@Param('id', ParseIntPipe) id: number) {
    const beacon = await this.beaconRepository.findOne({ where: { id } });

    if (!beacon) {
      return {
        success: false,
        message: 'Beacon not found',
      };
    }

    return {
      success: true,
      message: 'Beacon retrieved successfully',
      data: beacon,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update beacon (HR/Admin only)' })
  @ApiResponse({ status: 200, description: 'Beacon updated successfully' })
  async updateBeacon(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBeaconDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const updated = await this.beaconRepository.updateBeacon(
      id,
      dto,
      user.employee_id!,
    );

    if (!updated) {
      return {
        success: false,
        message: 'Beacon not found or update failed',
      };
    }

    return {
      success: true,
      message: 'Beacon updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete beacon (HR/Admin only)' })
  @ApiResponse({ status: 200, description: 'Beacon deleted successfully' })
  async deleteBeacon(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const deleted = await this.beaconRepository.deleteBeacon(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Beacon not found or delete failed',
      };
    }

    return {
      success: true,
      message: 'Beacon deleted successfully',
    };
  }

  @Get('department/:departmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get beacons by department' })
  @ApiResponse({
    status: 200,
    description: 'Department beacons retrieved successfully',
  })
  async getBeaconsByDepartment(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    const beacons = await this.beaconRepository.findByDepartment(departmentId);

    return {
      success: true,
      message: 'Department beacons retrieved successfully',
      data: beacons,
    };
  }

  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update beacon heartbeat (system call)' })
  @ApiResponse({ status: 200, description: 'Heartbeat updated successfully' })
  async updateHeartbeat(@Param('id', ParseIntPipe) id: number) {
    const updated = await this.beaconRepository.updateLastHeartbeat(id);

    return {
      success: updated,
      message: updated ? 'Heartbeat updated successfully' : 'Beacon not found',
    };
  }
}
