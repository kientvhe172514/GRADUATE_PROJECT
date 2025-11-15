/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateDepartmentDto } from '../../application/dto/department/create-department.dto';
import { UpdateDepartmentDto } from '../../application/dto/department/update-department.dto';
import { DepartmentDetailDto } from '../../application/dto/department/department-detail.dto';
import { CreateDepartmentUseCase } from '../../application/use-cases/create-department.use-case';
import { UpdateDepartmentUseCase } from '../../application/use-cases/update-department.use-case';
import { GetDepartmentDetailUseCase } from '../../application/use-cases/get-department-detail.use-case';
import { GetDepartmentsUseCase } from '../../application/use-cases/get-departments.use-case';
import { DeleteDepartmentUseCase } from '../../application/use-cases/delete-department.use-case';
import { ApiResponseDto, ResponseStatus, Permissions } from '@graduate-project/shared-common';
import { ListDepartmentDto } from '../../application/dto/department/list-department.dto';
import { GetDepartmentStatisticsUseCase } from '../../application/use-cases/get-department-statistics.use-case';
import { ValidatePositionBelongsToDepartmentUseCase } from '../../application/use-cases/validate-position-belongs-to-department.use-case';
import { ValidatePositionDepartmentDto, ValidatePositionDepartmentResponseDto } from '../../application/dto/position/validate-position-department.dto';
import { DepartmentStatisticsDto } from '../../application/dto/department/department-statistics.dto';

@ApiTags('departments')
@ApiBearerAuth('bearer')
@Controller('departments')
export class DepartmentController {
  constructor(
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
    private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
    private readonly getDepartmentDetailUseCase: GetDepartmentDetailUseCase,
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
    private readonly deleteDepartmentUseCase: DeleteDepartmentUseCase,
    private readonly getDepartmentStatisticsUseCase: GetDepartmentStatisticsUseCase,
    private readonly validatePositionBelongsToDepartmentUseCase: ValidatePositionBelongsToDepartmentUseCase,
  ) {}

  @Get()
  @Permissions('department.read')
  @ApiOperation({ summary: 'Get all departments with filters and pagination' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAll(@Query() filters?: ListDepartmentDto): Promise<ApiResponseDto<any>> {
    return await this.getDepartmentsUseCase.execute(filters || {});
  }

  @Post()
  @Permissions('department.create')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async create(@Body() createDepartmentDto: CreateDepartmentDto): Promise<ApiResponseDto<DepartmentDetailDto>> {
    const response = await this.createDepartmentUseCase.execute(createDepartmentDto);
    return new ApiResponseDto(
      ResponseStatus.SUCCESS,
      201,
      'Department created successfully',
      response.data
    );
  }

  @Get(':id')
  @Permissions('department.read')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<DepartmentDetailDto>> {
    const data = await this.getDepartmentDetailUseCase.execute(id);
    return new ApiResponseDto(
      ResponseStatus.SUCCESS,
      200,
      'Department retrieved successfully',
      data
    );
  }

  @Put(':id')
  @Permissions('department.update')
  @ApiOperation({ summary: 'Update department' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<ApiResponseDto<DepartmentDetailDto>> {
    const data = await this.updateDepartmentUseCase.execute(id, updateDepartmentDto);
    return new ApiResponseDto(
      ResponseStatus.SUCCESS,
      200,
      'Department updated successfully',
      data
    );
  }

  @Delete(':id')
  @Permissions('department.delete')
  @ApiOperation({ summary: 'Delete department' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<void>> {
    await this.deleteDepartmentUseCase.execute(id);
    return ApiResponseDto.success(undefined, 'Department deleted successfully');
  }

  @Get(':id/statistics')
  @Permissions('department.read')
  @ApiOperation({ summary: 'Get department statistics' })
  @ApiParam({ name: 'id', type: 'number', description: 'Department ID' })
  @ApiResponse({ status: 200, type: DepartmentStatisticsDto, description: 'Department statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async getStatistics(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<DepartmentStatisticsDto>> {
    return this.getDepartmentStatisticsUseCase.execute(id);
  }

  @Post('validate-position')
  @Permissions('department.read')
  @ApiOperation({ summary: 'Validate if position belongs to department' })
  @ApiBody({ type: ValidatePositionDepartmentDto })
  @ApiResponse({ status: 200, type: ValidatePositionDepartmentResponseDto, description: 'Validation result' })
  @ApiResponse({ status: 404, description: 'Position or department not found' })
  async validatePosition(
    @Body() dto: ValidatePositionDepartmentDto,
  ): Promise<ApiResponseDto<ValidatePositionDepartmentResponseDto>> {
    return this.validatePositionBelongsToDepartmentUseCase.execute(dto);
  }
}