import { Injectable, Inject } from '@nestjs/common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { DEPARTMENT_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';

@Injectable()
export class DeleteDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(id: number): Promise<void> {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw new DepartmentNotFoundException(id);
    }

    await this.departmentRepository.delete(id);
    
    this.eventPublisher.publish('department_deleted', { id });
  }
}