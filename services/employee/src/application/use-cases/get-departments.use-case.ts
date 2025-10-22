import { Injectable, Inject } from '@nestjs/common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { DEPARTMENT_REPOSITORY } from '../tokens';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';

@Injectable()
export class GetDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(): Promise<DepartmentDetailDto[]> {
    const departments = await this.departmentRepository.findAll();
    return departments.map(department => new DepartmentDetailDto(department));
  }
}