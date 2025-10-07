import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateEmployeeUseCase } from '../../application/use-cases/create-employee.use-case';
import { CreateEmployeeDto } from '../../application/dto/create-employee.dto';
import { Employee } from '../../domain/entities/employee.entity';

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly createEmployeeUseCase: CreateEmployeeUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, type: Employee })
  @ApiResponse({ status: 400, description: 'Validation or duplicate error' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    return this.createEmployeeUseCase.execute(createEmployeeDto);
  }
}