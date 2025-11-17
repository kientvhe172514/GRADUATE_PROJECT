export class GpsAnomalyEntity {
  id?: number;
  employee_id: number;
  shift_id?: number;

  // Anomaly Info
  anomaly_type:
    | 'TELEPORTATION'
    | 'OUT_OF_RANGE'
    | 'GPS_SPOOFING'
    | 'IMPOSSIBLE_SPEED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence_data?: {
    locations?: Array<{ lat: number; lng: number; timestamp: string }>;
    speeds?: Array<number>;
    distances?: Array<number>;
    [key: string]: any;
  };
  description: string;
  detected_at: Date;

  // Investigation
  auto_flagged: boolean;
  notified: boolean;
  requires_investigation: boolean;
  investigated_by?: number;
  investigated_at?: Date;
  investigation_notes?: string;
  investigation_result?:
    | 'CONFIRMED_FRAUD'
    | 'FALSE_POSITIVE'
    | 'TECHNICAL_ERROR';

  created_at?: Date;
  updated_at?: Date;

  constructor(partial: Partial<GpsAnomalyEntity>) {
    Object.assign(this, partial);
  }

  // Domain methods
  isCritical(): boolean {
    return this.severity === 'CRITICAL' || this.severity === 'HIGH';
  }

  needsInvestigation(): boolean {
    return this.requires_investigation && !this.investigated_at;
  }

  markAsInvestigated(
    investigatorId: number,
    result: string,
    notes?: string,
  ): void {
    this.investigated_by = investigatorId;
    this.investigated_at = new Date();
    this.investigation_result = result as any;
    this.investigation_notes = notes;
  }
}
