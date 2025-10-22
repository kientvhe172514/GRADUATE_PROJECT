import { Injectable, Inject } from '@nestjs/common';
import { UpdateDepartmentDto } from '../dto/department/update-department.dto';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { DEPARTMENT_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(id: number, dto: UpdateDepartmentDto): Promise<DepartmentDetailDto> {
    const existingDepartment = await this.departmentRepository.findById(id);
    if (!existingDepartment) {
      throw new DepartmentNotFoundException(id);
    }

    // Check if department code is being changed and if it already exists
    if (dto.department_code && dto.department_code !== existingDepartment.department_code) {
      const departmentWithCode = await this.departmentRepository.findByCode(dto.department_code);
      if (departmentWithCode) {
        throw new BusinessException(ErrorCodes.DEPARTMENT_CODE_ALREADY_EXISTS);
      }
    }

    const updatedDepartment = await this.departmentRepository.update(id, {
      ...existingDepartment,
      ...dto,
      updated_at: new Date()
    });

    this.eventPublisher.publish('department_updated', updatedDepartment);

    return new DepartmentDetailDto(updatedDepartment);
  }
}