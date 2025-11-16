import { GpsAnomalyEntity } from '../../domain/entities/gps-anomaly.entity';

export const GPS_ANOMALY_REPOSITORY = 'GPS_ANOMALY_REPOSITORY';

export interface GpsAnomalyRepositoryPort {
  create(anomaly: GpsAnomalyEntity): Promise<GpsAnomalyEntity>;

  findById(id: number): Promise<GpsAnomalyEntity | null>;

  findByEmployeeId(employeeId: number): Promise<GpsAnomalyEntity[]>;

  findByShiftId(shiftId: number): Promise<GpsAnomalyEntity[]>;

  findRequiringInvestigation(): Promise<GpsAnomalyEntity[]>;

  findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<GpsAnomalyEntity[]>;

  update(
    id: number,
    data: Partial<GpsAnomalyEntity>,
  ): Promise<GpsAnomalyEntity>;

  markAsNotified(id: number): Promise<void>;

  countByEmployeeAndType(
    employeeId: number,
    anomalyType: string,
  ): Promise<number>;
}
