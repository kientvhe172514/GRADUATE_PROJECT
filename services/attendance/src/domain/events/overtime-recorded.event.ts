import { EmployeeShiftEntity } from '../entities/employee-shift.entity';

export class OvertimeRecordedEvent {
  constructor(
    public readonly shift: EmployeeShiftEntity,
    public readonly overtimeHours: number,
  ) {}
}
