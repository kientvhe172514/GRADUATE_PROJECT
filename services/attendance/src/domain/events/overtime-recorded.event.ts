import { EmployeeShift } from '../entities/employee-shift.entity';

export class OvertimeRecordedEvent {
  constructor(
    public readonly shift: EmployeeShift,
    public readonly overtimeHours: number,
  ) {}
}
