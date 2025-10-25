import { Department } from '../entities/department.entity';

export class DepartmentCreatedEvent {
  constructor(public readonly department: Department) {}
}
