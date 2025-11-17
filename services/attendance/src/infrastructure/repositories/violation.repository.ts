import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { ViolationSchema } from '../persistence/typeorm/violation.schema';

@Injectable()
export class ViolationRepository extends Repository<ViolationSchema> {
  constructor(private dataSource: DataSource) {
    super(ViolationSchema, dataSource.createEntityManager());
  }

  async findByEmployeeId(employeeId: number, limit = 20, offset = 0) {
    return this.find({
      where: { employee_id: employeeId },
      order: { detected_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findUnresolvedViolations(limit = 50, offset = 0) {
    return this.find({
      where: { resolved: false },
      order: { detected_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async countByEmployeeId(employeeId: number): Promise<number> {
    return this.count({ where: { employee_id: employeeId } });
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    return this.find({
      where: {
        detected_at: Between(startDate, endDate),
      },
      order: { detected_at: 'DESC' },
    });
  }

  async getViolationStatistics(employeeId?: number) {
    const query = this.createQueryBuilder('violation');

    if (employeeId) {
      query.where('violation.employee_id = :employeeId', { employeeId });
    }

    // Count by type
    const byType = await query
      .select('violation.violation_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('violation.violation_type')
      .getRawMany();

    // Count by severity
    const bySeverity = await query
      .select('violation.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('violation.severity')
      .getRawMany();

    // Total and unresolved count
    const total = await query.getCount();
    const unresolved = await query
      .andWhere('violation.resolved = false')
      .getCount();

    return {
      total,
      unresolved,
      byType,
      bySeverity,
    };
  }

  async getTopViolators(limit = 10) {
    return this.createQueryBuilder('violation')
      .select('violation.employee_id', 'employeeId')
      .addSelect('COUNT(*)', 'violationCount')
      .groupBy('violation.employee_id')
      .orderBy('violationCount', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async resolveViolation(
    id: number,
    resolvedBy: number,
    notes: string,
  ): Promise<boolean> {
    const result = await this.update(id, {
      resolved: true,
      resolved_by: resolvedBy,
      resolved_at: new Date(),
      resolution_notes: notes,
      updated_at: new Date(),
      updated_by: resolvedBy,
    });
    return (result.affected ?? 0) > 0;
  }
}
