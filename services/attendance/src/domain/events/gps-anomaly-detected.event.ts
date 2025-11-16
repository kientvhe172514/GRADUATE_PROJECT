import { GpsAnomalyEntity } from '../entities/gps-anomaly.entity';

export class GpsAnomalyDetectedEvent {
  constructor(
    public readonly anomaly: GpsAnomalyEntity,
    public readonly employeeId: number,
    public readonly anomalyType: string,
    public readonly severity: string,
    public readonly requiresInvestigation: boolean,
  ) {}
}
