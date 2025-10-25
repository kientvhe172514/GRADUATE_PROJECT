import { Department } from '../entities/department.entity';

export class DepartmentUpdatedEvent {
  constructor(public readonly department: Department) {}
}
