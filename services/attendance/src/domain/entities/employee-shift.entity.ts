export class EmployeeShiftEntity {
  id?: number;
  employee_id?: number;
  employee_code?: string;
  department_id?: number;
  shift_id?: number;
  shift_date?: Date;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  actual_check_in?: Date;
  actual_check_out?: Date;
  work_hours?: number;
  overtime_hours?: number;
  late_minutes?: number;
  early_leave_minutes?: number;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  notes?: string;
  created_at?: Date;
  updated_at?: Date;

  constructor(partial: Partial<EmployeeShiftEntity>) {
    Object.assign(this, partial);
  }
}
