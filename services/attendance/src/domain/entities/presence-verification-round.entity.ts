export class PresenceVerificationRoundEntity {
  id?: number;
  shift_id: number;
  employee_id: number;
  round_number: number;

  // GPS Data
  latitude: number;
  longitude: number;
  location_accuracy?: number;

  // Validation
  is_valid: boolean;
  distance_from_office_meters?: number | null;
  distance_from_check_in_meters?: number | null;
  validation_status: 'VALID' | 'INVALID' | 'OUT_OF_RANGE' | 'SUSPICIOUS';
  validation_reason?: string;

  // Device Info
  device_id?: string;
  battery_level?: number;
  captured_at: Date;

  created_at?: Date;
  updated_at?: Date;

  constructor(partial: Partial<PresenceVerificationRoundEntity>) {
    Object.assign(this, partial);
  }

  // Domain methods
  isValid(): boolean {
    return this.is_valid && this.validation_status === 'VALID';
  }

  isWithinOfficeRange(maxDistanceMeters: number = 1000): boolean {
    return (this.distance_from_office_meters ?? Infinity) <= maxDistanceMeters;
  }

  hasGoodAccuracy(minAccuracyMeters: number = 100): boolean {
    return (this.location_accuracy ?? Infinity) <= minAccuracyMeters;
  }
}
