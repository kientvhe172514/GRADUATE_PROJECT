import { Injectable, Inject } from '@nestjs/common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { DEPARTMENT_REPOSITORY } from '../tokens';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';

@Injectable()
export class GetDepartmentDetailUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(id: number): Promise<DepartmentDetailDto> {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw new DepartmentNotFoundException(id);
    }

    return new DepartmentDetailDto(department);
  }
}