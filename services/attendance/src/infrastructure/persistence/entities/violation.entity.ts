export class ViolationEntity {
  id: number;
  employee_id: number;
  shift_id?: number;
  violation_type: string; // LATE, EARLY_LEAVE, ABSENT, GPS_FRAUD
  severity: string; // LOW, MEDIUM, HIGH
  description?: string;
  evidence_data?: any;
  detected_at: Date;
  resolved: boolean;
  resolved_by?: number;
  resolved_at?: Date;
  resolution_notes?: string;
  created_at: Date;
  created_by?: number;
  updated_at: Date;
  updated_by?: number;

  constructor(data: Partial<ViolationEntity>) {
    Object.assign(this, data);
  }
}

export class OvertimeRequestEntity {
  id: number;
  employee_id: number;
  shift_id?: number;
  overtime_date: Date;
  start_time: Date;
  end_time: Date;
  estimated_hours: number;
  actual_hours?: number;
  reason: string;
  status: string; // PENDING, APPROVED, REJECTED
  requested_at: Date;
  requested_by?: number;
  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  created_by?: number;
  updated_at: Date;
  updated_by?: number;

  constructor(data: Partial<OvertimeRequestEntity>) {
    Object.assign(this, data);
  }
}
