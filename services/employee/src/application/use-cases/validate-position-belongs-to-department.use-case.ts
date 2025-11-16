import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { POSITION_REPOSITORY, DEPARTMENT_REPOSITORY } from '../tokens';
import { PositionNotFoundException } from '../../domain/exceptions/position-not-found.exception';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { ValidatePositionDepartmentDto, ValidatePositionDepartmentResponseDto } from '../dto/position/validate-position-department.dto';

@Injectable()
export class ValidatePositionBelongsToDepartmentUseCase {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private readonly positionRepository: PositionRepositoryPort,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(
    dto: ValidatePositionDepartmentDto,
  ): Promise<ApiResponseDto<ValidatePositionDepartmentResponseDto>> {
    // Validate position exists
    const position = await this.positionRepository.findById(dto.position_id);
    if (!position) {
      throw new PositionNotFoundException(dto.position_id);
    }

    // Validate department exists
    const department = await this.departmentRepository.findById(dto.department_id);
    if (!department) {
      throw new DepartmentNotFoundException(dto.department_id);
    }

    // Check if position belongs to department
    const isValid = position.department_id === dto.department_id;

    const response: ValidatePositionDepartmentResponseDto = {
      valid: isValid,
      message: isValid
        ? 'Position belongs to the specified department'
        : `Position does not belong to department. Position belongs to department ID: ${position.department_id || 'none'}`,
      position: {
        id: position.id,
        position_code: position.position_code,
        position_name: position.position_name,
        department_id: position.department_id,
      },
      department: {
        id: department.id,
        department_code: department.department_code,
        department_name: department.department_name,
      },
    };

    return ApiResponseDto.success(
      response,
      isValid ? 'Validation successful' : 'Validation failed',
      200,
      undefined,
      isValid ? 'POSITION_DEPARTMENT_VALID' : 'POSITION_DEPARTMENT_INVALID',
    );
  }
}

