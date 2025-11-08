export class EmployeeShiftEntity {
  id: number;
  employee_id: number;
  employee_code: string;
  department_id: number;
  shift_date: Date;
  work_schedule_id?: number;
  
  // Time tracking
  check_in_time?: Date;
  check_in_record_id?: number;
  check_out_time?: Date;
  check_out_record_id?: number;
  
  scheduled_start_time: string;
  scheduled_end_time: string;
  
  // Calculated hours
  work_hours: number;
  overtime_hours: number;
  break_hours: number;
  
  // Violations
  late_minutes: number;
  early_leave_minutes: number;
  
  // Presence verification
  presence_verification_required: boolean;
  presence_verified: boolean;
  presence_verification_rounds_completed: number;
  presence_verification_rounds_required: number;
  
  // Status
  status: string; // SCHEDULED, IN_PROGRESS, COMPLETED, ON_LEAVE, ABSENT
  
  // Approval
  approved_by?: number;
  approved_at?: Date;
  
  // Manual edit flag
  is_manually_edited: boolean;
  
  // General notes
  notes?: string;
  
  created_at: Date;
  created_by?: number;
  updated_at: Date;
  updated_by?: number;

  constructor(data: Partial<EmployeeShiftEntity>) {
    Object.assign(this, data);
  }
}
