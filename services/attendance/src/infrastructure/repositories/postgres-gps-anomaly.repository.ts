import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { GpsAnomalyRepositoryPort } from '../../application/ports/gps-anomaly.repository.port';
import { GpsAnomalyEntity } from '../../domain/entities/gps-anomaly.entity';
import { GpsAnomalySchema } from '../database/schemas/gps-anomaly.schema';

/**
 * PostgreSQL implementation of GPS Anomaly Repository
 */
@Injectable()
export class PostgresGpsAnomalyRepository implements GpsAnomalyRepositoryPort {
  constructor(
    @InjectRepository(GpsAnomalySchema)
    private readonly repository: Repository<GpsAnomalySchema>,
  ) {}

  async create(anomaly: GpsAnomalyEntity): Promise<GpsAnomalyEntity> {
    const schema = GpsAnomalySchema.fromDomain(anomaly);
    const saved = await this.repository.save(schema);
    return saved.toDomain();
  }

  async findById(id: number): Promise<GpsAnomalyEntity | null> {
    const schema = await this.repository.findOne({ where: { id: String(id) } });
    return schema ? schema.toDomain() : null;
  }

  async findByEmployeeId(employeeId: number): Promise<GpsAnomalyEntity[]> {
    const schemas = await this.repository.find({
      where: { employee_id: String(employeeId) },
      order: { detected_at: 'DESC' },
    });
    return schemas.map((schema) => schema.toDomain());
  }

  async findByShiftId(shiftId: number): Promise<GpsAnomalyEntity[]> {
    const schemas = await this.repository.find({
      where: { shift_id: String(shiftId) },
      order: { detected_at: 'ASC' },
    });
    return schemas.map((schema) => schema.toDomain());
  }

  async findRequiringInvestigation(): Promise<GpsAnomalyEntity[]> {
    const schemas = await this.repository.find({
      where: {
        requires_investigation: true,
        investigation_result: IsNull(),
      },
      order: { severity: 'DESC', detected_at: 'ASC' },
    });
    return schemas.map((schema) => schema.toDomain());
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<GpsAnomalyEntity[]> {
    const schemas = await this.repository.find({
      where: {
        detected_at: Between(startDate, endDate),
      },
      order: { detected_at: 'DESC' },
    });
    return schemas.map((schema) => schema.toDomain());
  }

  async update(id: number, data: Partial<GpsAnomalyEntity>): Promise<GpsAnomalyEntity> {
    await this.repository.update(String(id), data as any);
    const updated = await this.repository.findOne({ where: { id: String(id) } });
    if (!updated) {
      throw new Error(`GPS anomaly ${id} not found`);
    }
    return updated.toDomain();
  }

  async markAsNotified(id: number): Promise<void> {
    await this.repository.update(id, {
      notified: true,
      notified_at: new Date(),
    });
  }

  async countByEmployeeAndType(employeeId: number, anomalyType: string): Promise<number> {
    return await this.repository.count({
      where: {
        employee_id: employeeId as any,
        anomaly_type: anomalyType,
      },
    });
  }
}
