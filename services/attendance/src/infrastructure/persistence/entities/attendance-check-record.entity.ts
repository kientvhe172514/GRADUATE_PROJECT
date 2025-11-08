export class AttendanceCheckRecordEntity {
  id: number;
  employee_id: number;
  employee_code: string;
  department_id: number;
  check_timestamp: Date;
  check_type: string; // CHECK_IN, CHECK_OUT, BREAK_START, BREAK_END
  
  // Beacon validation
  beacon_id?: number;
  beacon_validated: boolean;
  beacon_rssi?: number;
  beacon_distance_meters?: number;
  
  // GPS validation
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  location_name?: string;
  gps_validated: boolean;
  distance_from_office_meters?: number;
  
  // Device info
  device_id?: string;
  device_info?: any;
  ip_address?: string;
  
  // Face verification
  photo_url?: string;
  face_verified: boolean;
  face_confidence?: number;
  verified_at?: Date;
  
  // Overall validation
  is_valid: boolean;
  validation_errors?: any;
  
  // Manual correction tracking
  is_manually_corrected: boolean;
  correction_reason?: string;
  corrected_by?: number;
  corrected_at?: Date;
  
  notes?: string;
  created_at: Date;

  constructor(data: Partial<AttendanceCheckRecordEntity>) {
    Object.assign(this, data);
  }
}
