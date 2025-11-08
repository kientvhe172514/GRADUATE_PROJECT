import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, ParseIntPipe, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateLeaveTypeUseCase } from '../../application/leave-type/use-cases/create-leave-type.use-case';
import { GetLeaveTypesUseCase } from '../../application/leave-type/use-cases/get-leave-types.use-case';
import { UpdateLeaveTypeUseCase } from '../../application/leave-type/use-cases/update-leave-type.use-case';
import { GetLeaveTypeByIdUseCase } from '../../application/leave-type/use-cases/get-leave-type-by-id.use-case';
import { DeleteLeaveTypeUseCase } from '../../application/leave-type/use-cases/delete-leave-type.use-case';
import { 
  CreateLeaveTypeDto, 
  UpdateLeaveTypeDto, 
  ListLeaveTypesQueryDto,
  LeaveTypeResponseDto 
} from '../../application/leave-type/dto/leave-type.dto';
import { ApiResponseDto } from '@graduate-project/shared-common';

@ApiTags('leave-types')
@ApiBearerAuth('bearer')
@Controller('leave-types')
export class LeaveTypeController {
  constructor(
    private readonly createLeaveTypeUseCase: CreateLeaveTypeUseCase,
    private readonly getLeaveTypesUseCase: GetLeaveTypesUseCase,
    private readonly updateLeaveTypeUseCase: UpdateLeaveTypeUseCase,
    private readonly getLeaveTypeByIdUseCase: GetLeaveTypeByIdUseCase,
    private readonly deleteLeaveTypeUseCase: DeleteLeaveTypeUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all leave types with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiQuery({ name: 'is_paid', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAll(@Query() filters: ListLeaveTypesQueryDto): Promise<ApiResponseDto<LeaveTypeResponseDto[]>> {
    const data = await this.getLeaveTypesUseCase.execute(filters);
    return ApiResponseDto.success(data, 'Leave types retrieved successfully');
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active leave types (for dropdown/selection)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getActive(): Promise<ApiResponseDto<LeaveTypeResponseDto[]>> {
    const data = await this.getLeaveTypesUseCase.execute({ status: 'ACTIVE' } as any);
    return ApiResponseDto.success(data, 'Active leave types retrieved successfully');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get leave type by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Leave type ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<LeaveTypeResponseDto>> {
    const data = await this.getLeaveTypeByIdUseCase.execute(id);
    return ApiResponseDto.success(data, 'Leave type retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new leave type' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Leave type code already exists' })
  async create(@Body() dto: CreateLeaveTypeDto): Promise<ApiResponseDto<LeaveTypeResponseDto>> {
    const data = await this.createLeaveTypeUseCase.execute(dto);
    return ApiResponseDto.success(data, 'Leave type created successfully', HttpStatus.CREATED);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update leave type' })
  @ApiParam({ name: 'id', type: Number, description: 'Leave type ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdateLeaveTypeDto
  ): Promise<ApiResponseDto<LeaveTypeResponseDto>> {
    const data = await this.updateLeaveTypeUseCase.execute(id, dto);
    return ApiResponseDto.success(data, 'Leave type updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete leave type' })
  @ApiParam({ name: 'id', type: Number, description: 'Leave type ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<void>> {
    await this.deleteLeaveTypeUseCase.execute(id);
    return ApiResponseDto.success(undefined, 'Leave type deleted successfully');
  }
}