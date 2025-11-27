import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';

// DTOs
import {
  CreateGpsCheckConfigDto,
  UpdateGpsCheckConfigDto,
  GpsCheckConfigResponseDto,
} from '../dtos/gps-check-config.dto';

// Use Cases
import { CreateGpsCheckConfigUseCase } from '../../application/use-cases/gps-check-config/create-gps-check-config.use-case';
import { UpdateGpsCheckConfigUseCase } from '../../application/use-cases/gps-check-config/update-gps-check-config.use-case';
import { DeleteGpsCheckConfigUseCase } from '../../application/use-cases/gps-check-config/delete-gps-check-config.use-case';
import { GetGpsCheckConfigUseCase } from '../../application/use-cases/gps-check-config/get-gps-check-config.use-case';
import { ListGpsCheckConfigsUseCase } from '../../application/use-cases/gps-check-config/list-gps-check-configs.use-case';

@ApiTags('GPS Check Configuration')
@ApiBearerAuth()
@Controller('gps-check-config')
export class GpsCheckConfigController {
  constructor(
    private readonly createUseCase: CreateGpsCheckConfigUseCase,
    private readonly updateUseCase: UpdateGpsCheckConfigUseCase,
    private readonly deleteUseCase: DeleteGpsCheckConfigUseCase,
    private readonly getUseCase: GetGpsCheckConfigUseCase,
    private readonly listUseCase: ListGpsCheckConfigsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new GPS check configuration' })
  @ApiResponse({
    status: 201,
    description: 'Configuration created successfully',
    type: GpsCheckConfigResponseDto,
  })
  async create(
    @Body() dto: CreateGpsCheckConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.createUseCase.execute(dto as any, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all GPS check configurations' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter active configurations only',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurations retrieved successfully',
    type: [GpsCheckConfigResponseDto],
  })
  async list(@Query('activeOnly', new ParseBoolPipe({ optional: true })) activeOnly?: boolean) {
    return this.listUseCase.execute(activeOnly ?? false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get GPS check configuration by ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
    type: GpsCheckConfigResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.getUseCase.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update GPS check configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    type: GpsCheckConfigResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGpsCheckConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete GPS check configuration' })
  @ApiResponse({ status: 200, description: 'Configuration deleted successfully' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete default configuration',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.deleteUseCase.execute(id);
  }
}
