export class AttendanceCheckRecordEntity {
  id?: number;
  employee_id?: number;
  employee_code?: string;
  department_id?: number;
  check_type?: 'CHECK_IN' | 'CHECK_OUT';
  check_timestamp?: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  device_info?: string;
  ip_address?: string;
  is_valid?: boolean;
  beacon_validated?: boolean;
  gps_validated?: boolean;
  face_verified?: boolean;
  face_confidence?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  created_at?: Date;
  updated_at?: Date;

  constructor(partial: Partial<AttendanceCheckRecordEntity>) {
    Object.assign(this, partial);
  }
}
