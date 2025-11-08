export class EmployeeShiftEntity {
  id?: number;
  employeeId: number;
  shiftId: number;
  shiftDate: Date;
  shiftName?: string;
  startTime: string;
  endTime: string;
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  isOvertime?: boolean;
  overtimeMinutes?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<EmployeeShiftEntity>) {
    Object.assign(this, partial);
  }
}
