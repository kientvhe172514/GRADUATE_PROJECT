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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { GetHolidaysUseCase } from '../../application/holiday/use-cases/get-holidays.use-case';
import { GetHolidayByIdUseCase } from '../../application/holiday/use-cases/get-holiday-by-id.use-case';
import { CreateHolidayUseCase } from '../../application/holiday/use-cases/create-holiday.use-case';
import { UpdateHolidayUseCase } from '../../application/holiday/use-cases/update-holiday.use-case';
import { DeleteHolidayUseCase } from '../../application/holiday/use-cases/delete-holiday.use-case';
import { GetCalendarHolidaysUseCase } from '../../application/holiday/use-cases/get-calendar-holidays.use-case';
import { BulkCreateHolidaysUseCase } from '../../application/holiday/use-cases/bulk-create-holidays.use-case';
import { CreateHolidayDto, UpdateHolidayDto, BulkCreateHolidaysDto } from '../../application/holiday/dto/holiday.dto';
import { GetHolidaysQueryDto } from '../../application/holiday/dto/get-holidays-query.dto';
import {
  HolidayResponseDto,
  CreateHolidayResponseDto,
  CalendarHolidayResponseDto,
  BulkCreateHolidaysResponseDto,
} from '../../application/holiday/dto/holiday-response.dto';

@ApiTags('holidays')
@Controller('holidays')
export class HolidayController {
  constructor(
    private readonly getHolidaysUseCase: GetHolidaysUseCase,
    private readonly getHolidayByIdUseCase: GetHolidayByIdUseCase,
    private readonly createHolidayUseCase: CreateHolidayUseCase,
    private readonly updateHolidayUseCase: UpdateHolidayUseCase,
    private readonly deleteHolidayUseCase: DeleteHolidayUseCase,
    private readonly getCalendarHolidaysUseCase: GetCalendarHolidaysUseCase,
    private readonly bulkCreateHolidaysUseCase: BulkCreateHolidaysUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all holidays', description: 'Lấy danh sách ngày lễ (query: year, holiday_type)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Năm của holidays' })
  @ApiQuery({ name: 'holiday_type', required: false, type: String, description: 'Loại holiday (NATIONAL, RELIGIOUS, COMPANY, REGIONAL)' })
  @ApiResponse({
    status: 200,
    description: 'Holidays retrieved successfully',
    type: [HolidayResponseDto],
  })
  async getHolidays(@Query() query: GetHolidaysQueryDto): Promise<ApiResponseDto<HolidayResponseDto[]>> {
    const result = await this.getHolidaysUseCase.execute(query.year, query.holiday_type);

    return ApiResponseDto.success(result, 'Holidays retrieved successfully');
  }

  @Get('calendar/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get calendar holidays by year', description: 'Lấy calendar holidays theo năm' })
  @ApiParam({ name: 'year', type: Number, description: 'Năm cần lấy holidays' })
  @ApiResponse({
    status: 200,
    description: 'Calendar holidays retrieved successfully',
    type: CalendarHolidayResponseDto,
  })
  async getCalendarHolidays(@Param('year', ParseIntPipe) year: number): Promise<ApiResponseDto<CalendarHolidayResponseDto>> {
    const result = await this.getCalendarHolidaysUseCase.execute(year);

    return ApiResponseDto.success(result, 'Calendar holidays retrieved successfully');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get holiday by ID', description: 'Xem chi tiết holiday' })
  @ApiParam({ name: 'id', type: Number, description: 'Holiday ID' })
  @ApiResponse({
    status: 200,
    description: 'Holiday retrieved successfully',
    type: HolidayResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  async getHolidayById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<HolidayResponseDto>> {
    const result = await this.getHolidayByIdUseCase.execute(id);

    return ApiResponseDto.success(result, 'Holiday retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create holiday', description: 'Tạo ngày lễ mới (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Holiday created successfully',
    type: CreateHolidayResponseDto,
  })
  async createHoliday(@Body() dto: CreateHolidayDto): Promise<ApiResponseDto<CreateHolidayResponseDto>> {
    const result = await this.createHolidayUseCase.execute(dto);

    return ApiResponseDto.success(result, 'Holiday created successfully', 201);
  }

  @Post('bulk-create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create holidays', description: 'Tạo hàng loạt holidays (import từ file)' })
  @ApiResponse({
    status: 201,
    description: 'Holidays created successfully',
    type: BulkCreateHolidaysResponseDto,
  })
  async bulkCreateHolidays(@Body() dto: BulkCreateHolidaysDto): Promise<ApiResponseDto<BulkCreateHolidaysResponseDto>> {
    const result = await this.bulkCreateHolidaysUseCase.execute(dto);

    return ApiResponseDto.success(result, 'Holidays created successfully', 201);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update holiday', description: 'Cập nhật ngày lễ' })
  @ApiParam({ name: 'id', type: Number, description: 'Holiday ID' })
  @ApiResponse({
    status: 200,
    description: 'Holiday updated successfully',
    type: HolidayResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  async updateHoliday(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHolidayDto,
  ): Promise<ApiResponseDto<HolidayResponseDto>> {
    const result = await this.updateHolidayUseCase.execute(id, dto);

    return ApiResponseDto.success(result, 'Holiday updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete holiday', description: 'Xóa ngày lễ' })
  @ApiParam({ name: 'id', type: Number, description: 'Holiday ID' })
  @ApiResponse({
    status: 200,
    description: 'Holiday deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  async deleteHoliday(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.deleteHolidayUseCase.execute(id);

    return ApiResponseDto.success(null, 'Holiday deleted successfully');
  }
}

