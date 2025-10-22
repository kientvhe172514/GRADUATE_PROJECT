/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Put, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateEmployeeUseCase } from '../../application/use-cases/create-employee.use-case';
import { GetEmployeeDetailUseCase } from '../../application/use-cases/get-employee-detail.use-case';
import { UpdateEmployeeUseCase } from '../../application/use-cases/update-employee.use-case';
import { GetEmployeesUseCase } from '../../application/use-cases/get-employees.use-case';
import { TerminateEmployeeUseCase } from '../../application/use-cases/terminate-employee.use-case';
import { GetOnboardingStepsUseCase } from '../../application/use-cases/get-onboarding-steps.use-case';
import { UpdateOnboardingStepUseCase } from '../../application/use-cases/update-onboarding-step.use-case';
import { UpdateEmployeeDto } from '../../application/dto/employee/update-employee.dto';
import { EmployeeDetailDto } from '../../application/dto/employee/employee-detail.dto';
import { ListEmployeeDto } from '../../application/dto/employee/list-employee.dto';
import { TerminateEmployeeDto } from '../../application/dto/employee/terminate-employee.dto';
import { UpdateOnboardingStepDto } from '../../application/dto/onboarding/update-onboarding-step.dto';
import { Employee } from '../../domain/entities/employee.entity';
import { EmployeeOnboardingStep } from '../../domain/entities/employee-onboarding-step.entity';
import { CreateEmployeeResponseDto } from '../../application/dto/employee/create-employee-response.dto';
import { CreateEmployeeDto } from '../../application/dto/employee/create-employee.dto';
import { ApiResponseDto } from '@graduate-project/shared-common';

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly getEmployeeDetailUseCase: GetEmployeeDetailUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly getEmployeesUseCase: GetEmployeesUseCase,
    private readonly terminateEmployeeUseCase: TerminateEmployeeUseCase,
    private readonly getOnboardingStepsUseCase: GetOnboardingStepsUseCase,
    private readonly updateOnboardingStepUseCase: UpdateOnboardingStepUseCase,
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

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all employees with filters' })
  @ApiQuery({ type: ListEmployeeDto, required: false })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAll(@Query() filters?: ListEmployeeDto): Promise<ApiResponseDto<EmployeeDetailDto[]>> {
    try {
      const employees = await this.getEmployeesUseCase.execute(filters);
      return ApiResponseDto.success(employees, 'Employees retrieved successfully');
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error; // Let the global exception filter handle it
    }
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate employee' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: TerminateEmployeeDto })
  @ApiResponse({ status: 200, type: Employee })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async terminate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TerminateEmployeeDto,
  ): Promise<ApiResponseDto<Employee>> {
    const employee = await this.terminateEmployeeUseCase.execute(id, dto);
    return ApiResponseDto.success(employee, 'Employee terminated successfully');
  }

  @Get(':employeeId/onboarding-steps')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get employee onboarding steps' })
  @ApiParam({ name: 'employeeId', type: 'number', description: 'Employee ID' })
  @ApiResponse({ status: 200, type: [EmployeeOnboardingStep] })
  async getOnboardingSteps(
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ): Promise<ApiResponseDto<EmployeeOnboardingStep[]>> {
    const steps = await this.getOnboardingStepsUseCase.execute(employeeId);
    return ApiResponseDto.success(steps, 'Onboarding steps retrieved successfully');
  }

  @Put(':employeeId/onboarding-steps/:stepName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update onboarding step status' })
  @ApiParam({ name: 'employeeId', type: 'number', description: 'Employee ID' })
  @ApiParam({ name: 'stepName', type: 'string', description: 'Onboarding Step Name' })
  @ApiBody({ type: UpdateOnboardingStepDto })
  @ApiResponse({ status: 200, type: EmployeeOnboardingStep })
  @ApiResponse({ status: 404, description: 'Employee or step not found' })
  async updateOnboardingStep(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Param('stepName') stepName: string,
    @Body() dto: UpdateOnboardingStepDto,
  ): Promise<ApiResponseDto<EmployeeOnboardingStep>> {
    const step = await this.updateOnboardingStepUseCase.execute(employeeId, stepName, dto);
    return ApiResponseDto.success(step, 'Onboarding step updated successfully');
  }
}