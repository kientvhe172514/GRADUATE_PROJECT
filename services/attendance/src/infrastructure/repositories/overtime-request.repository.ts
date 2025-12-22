import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { OvertimeRequestSchema } from '../persistence/typeorm/overtime-request.schema';

@Injectable()
export class OvertimeRequestRepository extends Repository<OvertimeRequestSchema> {
  constructor(private dataSource: DataSource) {
    super(OvertimeRequestSchema, dataSource.createEntityManager());
  }

  async findByEmployeeId(
    employeeId: number,
    limit = 20,
    offset = 0,
  ): Promise<OvertimeRequestSchema[]> {
    return this.find({
      where: { employee_id: employeeId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findPendingRequests(
    limit = 50,
    offset = 0,
  ): Promise<OvertimeRequestSchema[]> {
    return this.find({
      where: { status: 'PENDING' },
      order: { requested_at: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async findByStatus(
    status: string,
    limit = 50,
    offset = 0,
  ): Promise<OvertimeRequestSchema[]> {
    return this.find({
      where: { status },
      order: { overtime_date: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<OvertimeRequestSchema[]> {
    return this.find({
      where: {
        overtime_date: Between(startDate, endDate),
      },
      order: { overtime_date: 'DESC' },
    });
  }

  async createRequest(
    data: Partial<OvertimeRequestSchema>,
  ): Promise<OvertimeRequestSchema> {
    const request = this.create({
      ...data,
      status: 'PENDING',
      requested_at: new Date(),
    } as any);
    const saved = await this.save(request);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateRequest(
    id: number,
    data: Partial<OvertimeRequestSchema>,
  ): Promise<boolean> {
    const result = await this.update(id, {
      ...data,
      updated_at: new Date(),
    } as any);
    return (result.affected ?? 0) > 0;
  }

  async approveRequest(
    id: number,
    approvedBy: number,
    otShiftId?: number,
  ): Promise<boolean> {
    const result = await this.update(id, {
      status: 'APPROVED',
      approved_by: approvedBy,
      approved_at: new Date(),
      ot_shift_id: otShiftId,
      updated_at: new Date(),
    });
    return (result.affected ?? 0) > 0;
  }

  async rejectRequest(
    id: number,
    rejectedBy: number,
    reason: string,
  ): Promise<boolean> {
    const result = await this.update(id, {
      status: 'REJECTED',
      approved_by: rejectedBy,
      approved_at: new Date(),
      rejection_reason: reason,
      updated_at: new Date(),
    });
    return (result.affected ?? 0) > 0;
  }

  async updateActualHours(id: number, actualHours: number): Promise<boolean> {
    const result = await this.update(id, {
      actual_hours: actualHours,
      updated_at: new Date(),
    });
    return (result.affected ?? 0) > 0;
  }

  async countPendingByEmployee(employeeId: number): Promise<number> {
    return this.count({
      where: { employee_id: employeeId, status: 'PENDING' },
    });
  }

  /**
   * Find overlapping overtime requests for a specific employee on a specific date
   * Used to prevent duplicate/overlapping overtime requests
   */
  async findOverlappingRequests(
    employeeId: number,
    overtimeDate: Date,
    startTime: Date,
    endTime: Date,
    excludeOvertimeId?: number,
  ): Promise<OvertimeRequestSchema[]> {
    // Query overtime requests on the same date with PENDING or APPROVED status
    const dateStr = overtimeDate.toISOString().split('T')[0];
    
    const query = this.createQueryBuilder('ot')
      .where('ot.employee_id = :employeeId', { employeeId })
      .andWhere('ot.overtime_date::date = :dateStr::date', { dateStr })
      .andWhere('ot.status IN (:...statuses)', { statuses: ['PENDING', 'APPROVED'] })
      .andWhere(
        // Check time overlap: (start1 < end2 AND end1 > start2)
        '(ot.start_time < :endTime AND ot.end_time > :startTime)',
        { startTime, endTime }
      );

    // Exclude current overtime request when updating
    if (excludeOvertimeId) {
      query.andWhere('ot.id != :excludeOvertimeId', { excludeOvertimeId });
    }

    return query.getMany();
  }

  async getTotalOvertimeHours(
    employeeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.createQueryBuilder('ot')
      .select('SUM(ot.actual_hours)', 'total')
      .where('ot.employee_id = :employeeId', { employeeId })
      .andWhere('ot.status = :status', { status: 'APPROVED' })
      .andWhere('ot.overtime_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}
