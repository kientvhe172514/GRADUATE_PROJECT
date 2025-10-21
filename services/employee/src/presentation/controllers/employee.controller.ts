import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Put, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateEmployeeUseCase } from '../../application/use-cases/create-employee.use-case';
import { GetEmployeeDetailUseCase } from '../../application/use-cases/get-employee-detail.use-case';
import { UpdateEmployeeUseCase } from '../../application/use-cases/update-employee.use-case';
import { CreateEmployeeDto } from '../../application/dto/create-employee.dto';
import { UpdateEmployeeDto } from '../../application/dto/update-employee.dto';
import { EmployeeDetailDto } from '../../application/dto/employee-detail.dto';
import { Employee } from '../../domain/entities/employee.entity';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { CreateEmployeeResponseDto } from '../../application/dto/create-employee-response.dto';

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly getEmployeeDetailUseCase: GetEmployeeDetailUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Employee created' })
  @ApiResponse({ status: 400, description: 'Validation or duplicate error' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<ApiResponseDto<CreateEmployeeResponseDto>> {
    return this.createEmployeeUseCase.execute(createEmployeeDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get employee detail by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiResponse({ status: 200, type: EmployeeDetailDto })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getDetail(@Param('id', ParseIntPipe) id: number): Promise<EmployeeDetailDto> {
    return this.getEmployeeDetailUseCase.execute(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update employee information' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiResponse({ status: 200, type: Employee })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    // TODO: Get updatedBy from authentication context
    const updatedBy = undefined; // Replace with actual user ID from JWT
    return this.updateEmployeeUseCase.execute(id, updateEmployeeDto, updatedBy);
  }
}