import { Employee } from '../entities/employee.entity';

export class EmployeeCreatedEvent {
  constructor(public readonly employee: Employee) {}
}