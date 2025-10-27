export class TimesheetEntryEntity {
  id: number;
  
  // Denormalized employee info
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department_id: number;
  department_name: string;
  position_name?: string;
  
  // Date breakdown
  entry_date: Date;
  year: number;
  month: number;
  week: number;
  day_of_week: number;
  
  // Hours
  scheduled_hours: number;
  work_hours: number;
  overtime_hours: number;
  leave_hours: number;
  absent_hours: number;
  
  // Status
  status: string;
  
  // Violations
  late_minutes: number;
  early_leave_minutes: number;
  has_violation: boolean;
  
  // Check times
  check_in_time?: Date;
  check_out_time?: Date;
  
  // Validation flags
  beacon_validated: boolean;
  gps_validated: boolean;
  face_verified: boolean;
  presence_verified: boolean;
  
  synced_at: Date;

  constructor(data: Partial<TimesheetEntryEntity>) {
    Object.assign(this, data);
  }
}
