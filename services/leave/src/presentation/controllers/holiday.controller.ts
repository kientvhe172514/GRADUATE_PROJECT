import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, ParseIntPipe, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { 
  CreateHolidayDto, 
  UpdateHolidayDto, 
  HolidayResponseDto,
  GetHolidaysQueryDto,
  BulkCreateHolidaysDto 
} from '../../application/holiday/dto/holiday.dto';
import { CreateHolidayUseCase } from '../../application/holiday/use-cases/create-holiday.use-case';
import { UpdateHolidayUseCase } from '../../application/holiday/use-cases/update-holiday.use-case';
import { DeleteHolidayUseCase } from '../../application/holiday/use-cases/delete-holiday.use-case';
import { GetHolidayByIdUseCase } from '../../application/holiday/use-cases/get-holiday-by-id.use-case';
import { GetHolidaysUseCase } from '../../application/holiday/use-cases/get-holidays.use-case';
import { GetHolidaysByYearUseCase } from '../../application/holiday/use-cases/get-holidays-by-year.use-case';
import { BulkCreateHolidaysUseCase } from '../../application/holiday/use-cases/bulk-create-holidays.use-case';

@ApiTags('holidays')
@ApiBearerAuth('bearer')
@Controller('holidays')
export class HolidayController {
  constructor(
    private readonly createHolidayUseCase: CreateHolidayUseCase,
    private readonly updateHolidayUseCase: UpdateHolidayUseCase,
    private readonly deleteHolidayUseCase: DeleteHolidayUseCase,
    private readonly getHolidayByIdUseCase: GetHolidayByIdUseCase,
    private readonly getHolidaysUseCase: GetHolidaysUseCase,
    private readonly getHolidaysByYearUseCase: GetHolidaysByYearUseCase,
    private readonly bulkCreateHolidaysUseCase: BulkCreateHolidaysUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all holidays with optional filters' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'holiday_type', required: false, enum: ['PUBLIC_HOLIDAY', 'COMPANY_HOLIDAY', 'REGIONAL_HOLIDAY', 'RELIGIOUS_HOLIDAY'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAll(@Query() filters: GetHolidaysQueryDto): Promise<ApiResponseDto<HolidayResponseDto[]>> {
    const data = await this.getHolidaysUseCase.execute(filters);
    return ApiResponseDto.success(data, 'Holidays retrieved successfully');
  }

  @Get('calendar/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get holiday calendar by year' })
  @ApiParam({ name: 'year', type: Number, description: 'Year (e.g., 2025)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getCalendar(@Param('year', ParseIntPipe) year: number): Promise<ApiResponseDto<HolidayResponseDto[]>> {
    const data = await this.getHolidaysByYearUseCase.execute(year);
    return ApiResponseDto.success(data, `Holiday calendar for ${year} retrieved successfully`);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get holiday by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Holiday ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<HolidayResponseDto>> {
    const data = await this.getHolidayByIdUseCase.execute(id);
    return ApiResponseDto.success(data, 'Holiday retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new holiday' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Holiday already exists' })
  async create(@Body() dto: CreateHolidayDto): Promise<ApiResponseDto<HolidayResponseDto>> {
    const data = await this.createHolidayUseCase.execute(dto);
    return ApiResponseDto.success(data, 'Holiday created successfully', HttpStatus.CREATED);
  }

  @Post('bulk-create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Bulk create holidays',
    description: 'Create multiple holidays at once. Useful for importing holidays from file or setting up annual calendar.'
  })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async bulkCreate(@Body() dto: BulkCreateHolidaysDto): Promise<ApiResponseDto<HolidayResponseDto[]>> {
    const data = await this.bulkCreateHolidaysUseCase.execute(dto);
    return ApiResponseDto.success(
      data, 
      `Successfully created ${data.length} holiday(s)`,
      HttpStatus.CREATED
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update holiday' })
  @ApiParam({ name: 'id', type: Number, description: 'Holiday ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHolidayDto
  ): Promise<ApiResponseDto<HolidayResponseDto>> {
    const data = await this.updateHolidayUseCase.execute(id, dto);
    return ApiResponseDto.success(data, 'Holiday updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete holiday' })
  @ApiParam({ name: 'id', type: Number, description: 'Holiday ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<void>> {
    await this.deleteHolidayUseCase.execute(id);
    return ApiResponseDto.success(undefined, 'Holiday deleted successfully');
  }
}

