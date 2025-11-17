import { EmployeeShiftEntity } from '../entities/employee-shift.entity';

export class ShiftCompletedEvent {
  constructor(public readonly shift: EmployeeShiftEntity) {}
}
