export class MonthlySummaryEntity {
  id: number;
  
  // Denormalized employee info
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department_id: number;
  department_name: string;
  
  year: number;
  month: number;
  
  // Days count
  total_work_days: number;
  actual_work_days: number;
  absent_days: number;
  leave_days: number;
  holiday_days: number;
  
  // Hours
  total_work_hours: number;
  total_overtime_hours: number;
  total_leave_hours: number;
  
  // Violations
  late_count: number;
  early_leave_count: number;
  absent_count: number;
  total_late_minutes: number;
  
  // Performance metrics
  attendance_rate?: number;
  punctuality_rate?: number;
  
  generated_at: Date;

  constructor(data: Partial<MonthlySummaryEntity>) {
    Object.assign(this, data);
  }
}
