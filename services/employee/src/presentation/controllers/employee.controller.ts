/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Put, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CreateEmployeeUseCase } from '../../application/use-cases/create-employee.use-case';
import { GetEmployeeDetailUseCase } from '../../application/use-cases/get-employee-detail.use-case';
import { UpdateEmployeeUseCase } from '../../application/use-cases/update-employee.use-case';
import { AssignRoleUseCase } from '../../application/use-cases/assign-role.use-case';
import { AssignDepartmentDto } from '../../application/dto/assign-department.dto';
import { AssignRoleDto } from '../../application/dto/assign-role.dto';
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
import { ApiResponseDto, Permissions } from '@graduate-project/shared-common';
import { AssignEmployeeToDepartmentUseCase } from '../../application/use-cases/assign-employee-to-department.use-case';
import { AssignEmployeeToPositionUseCase } from '../../application/use-cases/assign-employee-to-position.use-case';
import { RemoveEmployeeFromDepartmentUseCase } from '../../application/use-cases/remove-employee-from-department.use-case';
import { RemoveEmployeeFromPositionUseCase } from '../../application/use-cases/remove-employee-from-position.use-case';
import { TransferEmployeeBetweenDepartmentsUseCase } from '../../application/use-cases/transfer-employee-between-departments.use-case';
import { GetEmployeeAssignmentDetailsUseCase } from '../../application/use-cases/get-employee-assignment-details.use-case';
import { AssignEmployeeToDepartmentDto } from '../../application/dto/employee/assign-employee-to-department.dto';
import { AssignEmployeeToPositionDto } from '../../application/dto/employee/assign-employee-to-position.dto';
import { RemoveEmployeeFromDepartmentDto } from '../../application/dto/employee/remove-employee-from-department.dto';
import { RemoveEmployeeFromPositionDto } from '../../application/dto/employee/remove-employee-from-position.dto';
import { TransferEmployeeBetweenDepartmentsDto } from '../../application/dto/employee/transfer-employee-between-departments.dto';
import { EmployeeAssignmentDto } from '../../application/dto/employee/employee-assignment.dto';

@ApiTags('employees')
@ApiBearerAuth('bearer')
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
    private readonly assignEmployeeToDepartmentUseCase: AssignEmployeeToDepartmentUseCase,
    private readonly assignEmployeeToPositionUseCase: AssignEmployeeToPositionUseCase,
    private readonly removeEmployeeFromDepartmentUseCase: RemoveEmployeeFromDepartmentUseCase,
    private readonly removeEmployeeFromPositionUseCase: RemoveEmployeeFromPositionUseCase,
    private readonly transferEmployeeBetweenDepartmentsUseCase: TransferEmployeeBetweenDepartmentsUseCase,
    private readonly getEmployeeAssignmentDetailsUseCase: GetEmployeeAssignmentDetailsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('employee.create')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Employee created' })
  @ApiResponse({ status: 400, description: 'Validation or duplicate error' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<ApiResponseDto<CreateEmployeeResponseDto>> {
    return this.createEmployeeUseCase.execute(createEmployeeDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.read')
  @ApiOperation({ summary: 'Get employee detail by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiResponse({ status: 200, type: EmployeeDetailDto })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getDetail(@Param('id', ParseIntPipe) id: number): Promise<EmployeeDetailDto> {
    return this.getEmployeeDetailUseCase.execute(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.update')
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
  @Permissions('employee.read')
  @ApiOperation({ summary: 'Get all employees with filters and pagination' })
  @ApiQuery({ type: ListEmployeeDto, required: false })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAll(@Query() filters?: ListEmployeeDto): Promise<ApiResponseDto<any>> {
    return await this.getEmployeesUseCase.execute(filters || {});
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.terminate')
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
  @Permissions('employee.read')
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
  @Permissions('employee.onboarding.update')
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

  @Post(':id/assign-department')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.assign_department')
  @ApiOperation({ summary: 'Assign employee to department' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: AssignEmployeeToDepartmentDto })
  @ApiResponse({ status: 200, description: 'Employee assigned to department successfully' })
  @ApiResponse({ status: 404, description: 'Employee or department not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async assignToDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEmployeeToDepartmentDto,
  ): Promise<ApiResponseDto<EmployeeDetailDto>> {
    return this.assignEmployeeToDepartmentUseCase.execute(id, dto);
  }

  @Post(':id/assign-position')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.assign_position')
  @ApiOperation({ summary: 'Assign employee to position' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: AssignEmployeeToPositionDto })
  @ApiResponse({ status: 200, description: 'Employee assigned to position successfully' })
  @ApiResponse({ status: 404, description: 'Employee or position not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async assignToPosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEmployeeToPositionDto,
  ): Promise<ApiResponseDto<EmployeeDetailDto>> {
    return this.assignEmployeeToPositionUseCase.execute(id, dto);
  }

  @Post(':id/remove-department')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.remove_department')
  @ApiOperation({ summary: 'Remove employee from department' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: RemoveEmployeeFromDepartmentDto })
  @ApiResponse({ status: 200, description: 'Employee removed from department successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Employee is not assigned to any department' })
  async removeFromDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RemoveEmployeeFromDepartmentDto,
  ): Promise<ApiResponseDto<EmployeeDetailDto>> {
    return this.removeEmployeeFromDepartmentUseCase.execute(id, dto);
  }

  @Post(':id/remove-position')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.remove_position')
  @ApiOperation({ summary: 'Remove employee from position' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: RemoveEmployeeFromPositionDto })
  @ApiResponse({ status: 200, description: 'Employee removed from position successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Employee is not assigned to any position' })
  async removeFromPosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RemoveEmployeeFromPositionDto,
  ): Promise<ApiResponseDto<EmployeeDetailDto>> {
    return this.removeEmployeeFromPositionUseCase.execute(id, dto);
  }

  @Post(':id/transfer-department')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.transfer_department')
  @ApiOperation({ summary: 'Transfer employee between departments' })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiBody({ type: TransferEmployeeBetweenDepartmentsDto })
  @ApiResponse({ status: 200, description: 'Employee transferred to department successfully' })
  @ApiResponse({ status: 404, description: 'Employee or department not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async transferDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferEmployeeBetweenDepartmentsDto,
  ): Promise<ApiResponseDto<EmployeeDetailDto>> {
    return this.transferEmployeeBetweenDepartmentsUseCase.execute(id, dto);
  }

  @Get(':id/assignment')
  @HttpCode(HttpStatus.OK)
  @Permissions('employee.read')
  @ApiOperation({ summary: "Get employee's current assignment details" })
  @ApiParam({ name: 'id', type: 'number', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee assignment details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getAssignmentDetails(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<EmployeeAssignmentDto>> {
    return this.getEmployeeAssignmentDetailsUseCase.execute(id);
  }
}