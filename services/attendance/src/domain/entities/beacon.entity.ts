export class BeaconEntity {
  id: number;
  beacon_uuid: string;
  beacon_major: number;
  beacon_minor: number;
  beacon_name: string;
  department_id: number;
  location_name: string;
  floor?: string;
  building?: string;
  room_number?: string;
  latitude?: number;
  longitude?: number;
  signal_range_meters: number;
  rssi_threshold: number;
  status: string;
  battery_level?: number;
  last_heartbeat_at?: Date;
  created_at: Date;
  created_by?: number;
  updated_at: Date;
  updated_by?: number;

  constructor(data: Partial<BeaconEntity>) {
    Object.assign(this, data);
  }
}
