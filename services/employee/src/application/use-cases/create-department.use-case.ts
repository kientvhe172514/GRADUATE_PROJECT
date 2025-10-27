/* eslint-disable prettier/prettier */
import { Injectable, Inject } from '@nestjs/common';
import { CreateDepartmentDto } from '../dto/department/create-department.dto';
import { Department } from '../../domain/entities/department.entity';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { DEPARTMENT_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { BusinessException } from '@graduate-project/shared-common';
import { ErrorCodes } from  '@graduate-project/shared-common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: CreateDepartmentDto): Promise<ApiResponseDto<DepartmentDetailDto>> {
    const existingByCode = await this.departmentRepository.findByCode(dto.department_code);
    if (existingByCode) {
      throw new BusinessException(
        ErrorCodes.DEPARTMENT_CODE_ALREADY_EXISTS,
        'Department code already exists',
        400
      );
    }

    const department = new Department(dto);
    const savedDepartment = await this.departmentRepository.create(department);
    
    this.eventPublisher.publish('department_created', savedDepartment);

    return ApiResponseDto.success(
      new DepartmentDetailDto(savedDepartment),
      'Department created successfully',
      201
    );
  }
}