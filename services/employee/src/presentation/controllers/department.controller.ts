/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateDepartmentDto } from '../../application/dto/department/create-department.dto';
import { UpdateDepartmentDto } from '../../application/dto/department/update-department.dto';
import { DepartmentDetailDto } from '../../application/dto/department/department-detail.dto';
import { ApiResponseDto, ResponseStatus } from '../../common/dto/api-response.dto';
import { CreateDepartmentUseCase } from '../../application/use-cases/create-department.use-case';
import { UpdateDepartmentUseCase } from '../../application/use-cases/update-department.use-case';
import { GetDepartmentDetailUseCase } from '../../application/use-cases/get-department-detail.use-case';
import { GetDepartmentsUseCase } from '../../application/use-cases/get-departments.use-case';
import { DeleteDepartmentUseCase } from '../../application/use-cases/delete-department.use-case';

@ApiTags('departments')
@Controller('departments')
export class DepartmentController {
  constructor(
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
    private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
    private readonly getDepartmentDetailUseCase: GetDepartmentDetailUseCase,
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
    private readonly deleteDepartmentUseCase: DeleteDepartmentUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAll(): Promise<ApiResponseDto<DepartmentDetailDto[]>> {
    const data = await this.getDepartmentsUseCase.execute();
    return new ApiResponseDto(
      ResponseStatus.SUCCESS,
      200,
      'Departments retrieved successfully',
      data
    );
  }

  @Post()
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
  @ApiOperation({ summary: 'Delete department' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<void>> {
    await this.deleteDepartmentUseCase.execute(id);
    return ApiResponseDto.success(undefined, 'Department deleted successfully');
  }
}