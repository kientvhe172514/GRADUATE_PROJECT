export class ViolationEntity {
  id?: number;
  employee_id?: number;
  shift_id?: number;
  violation_type?:
    | 'LATE'
    | 'EARLY_LEAVE'
    | 'MISSING_CHECKIN'
    | 'MISSING_CHECKOUT'
    | 'ABSENT'
    | 'OTHER';
  violation_date?: Date;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  detected_at?: Date;
  reference_id?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  approved_by?: number;
  approved_at?: Date;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;

  constructor(partial: Partial<ViolationEntity>) {
    Object.assign(this, partial);
  }
}
