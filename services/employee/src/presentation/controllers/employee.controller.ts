import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Put, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateEmployeeUseCase } from '../../application/use-cases/create-employee.use-case';
import { GetEmployeeDetailUseCase } from '../../application/use-cases/get-employee-detail.use-case';
import { UpdateEmployeeUseCase } from '../../application/use-cases/update-employee.use-case';
import { AssignRoleUseCase } from '../../application/use-cases/assign-role.use-case';
import { CreateEmployeeDto } from '../../application/dto/create-employee.dto';
import { UpdateEmployeeDto } from '../../application/dto/update-employee.dto';
import { AssignDepartmentDto } from '../../application/dto/assign-department.dto';
import { AssignRoleDto } from '../../application/dto/assign-role.dto';
import { EmployeeDetailDto } from '../../application/dto/employee-detail.dto';
import { Employee } from '../../domain/entities/employee.entity';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { CreateEmployeeResponseDto } from '../../application/dto/create-employee-response.dto';

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly getEmployeeDetailUseCase: GetEmployeeDetailUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly assignRoleUseCase: AssignRoleUseCase,
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

  @Post(':id/assign-department')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign or change department for an employee (HR)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: AssignDepartmentDto })
  @ApiResponse({ status: 200, description: 'Employee department assigned/updated' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async assignDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignDepartmentDto,
  ): Promise<Employee> {
    // TODO: resolve updatedBy from auth context
    const updatedBy = undefined;
    return this.updateEmployeeUseCase.execute(id, { department_id: dto.department_id }, updatedBy);
  }

  @Post(':id/assign-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign or update role for an employee (Admin/HR)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: AssignRoleDto })
  @ApiResponse({ status: 200, description: 'Role assignment published' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRoleDto,
  ) {
    // TODO: resolve assignedBy from auth context
    const assignedBy = undefined;
    return this.assignRoleUseCase.execute(id, dto.role, assignedBy);
  }
}