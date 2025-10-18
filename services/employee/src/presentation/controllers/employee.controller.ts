import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateEmployeeUseCase } from '../../application/use-cases/create-employee.use-case';
import { CreateEmployeeDto } from '../../application/dto/create-employee.dto';
import { Employee } from '../../domain/entities/employee.entity';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { CreateEmployeeResponseDto } from '../../application/dto/create-employee-response.dto';

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly createEmployeeUseCase: CreateEmployeeUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Employee created' })
  @ApiResponse({ status: 400, description: 'Validation or duplicate error' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<ApiResponseDto<CreateEmployeeResponseDto>> {
    return this.createEmployeeUseCase.execute(createEmployeeDto);
  }
}