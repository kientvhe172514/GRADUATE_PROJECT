export class WorkScheduleEntity {
  id: number;
  schedule_name: string;
  schedule_type: string;
  work_days?: string;
  start_time?: string;
  end_time?: string;
  break_duration_minutes: number;
  late_tolerance_minutes: number;
  early_leave_tolerance_minutes: number;
  status: string;
  created_at: Date;
  created_by?: number;
  updated_at: Date;
  updated_by?: number;

  constructor(data: Partial<WorkScheduleEntity>) {
    Object.assign(this, data);
  }
}

export class EmployeeWorkScheduleEntity {
  id: number;
  employee_id: number;
  work_schedule_id: number;
  effective_from: Date;
  effective_to?: Date;
  created_at: Date;
  created_by?: number;

  constructor(data: Partial<EmployeeWorkScheduleEntity>) {
    Object.assign(this, data);
  }
}
