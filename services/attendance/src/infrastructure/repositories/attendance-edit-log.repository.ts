import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { AttendanceEditLogSchema } from '../persistence/typeorm/attendance-edit-log.schema';

@Injectable()
export class AttendanceEditLogRepository extends Repository<AttendanceEditLogSchema> {
  constructor(private dataSource: DataSource) {
    super(AttendanceEditLogSchema, dataSource.createEntityManager());
  }

  async findByShiftId(shiftId: number): Promise<AttendanceEditLogSchema[]> {
    return this.find({
      where: { shift_id: shiftId },
      order: { edited_at: 'ASC' },
    });
  }

  async findByEmployeeId(
    employeeId: number,
    limit = 50,
    offset = 0,
  ): Promise<AttendanceEditLogSchema[]> {
    return this.find({
      where: { employee_id: employeeId },
      order: { edited_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByEditedBy(
    editorUserId: number,
    limit = 50,
    offset = 0,
  ): Promise<AttendanceEditLogSchema[]> {
    return this.find({
      where: { edited_by_user_id: editorUserId },
      order: { edited_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit = 100,
    offset = 0,
  ): Promise<AttendanceEditLogSchema[]> {
    return this.find({
      where: {
        edited_at: Between(startDate, endDate),
      },
      order: { edited_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async createLog(
    data: Partial<AttendanceEditLogSchema>,
  ): Promise<AttendanceEditLogSchema> {
    const log = this.create({
      ...data,
      edited_at: new Date(),
    } as any);
    const saved = await this.save(log);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async countByEmployee(employeeId: number): Promise<number> {
    return this.count({ where: { employee_id: employeeId } });
  }

  async countByEditor(editorUserId: number): Promise<number> {
    return this.count({ where: { edited_by_user_id: editorUserId } });
  }

  async getRecentEdits(
    hours = 24,
    limit = 100,
  ): Promise<AttendanceEditLogSchema[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.createQueryBuilder('log')
      .where('log.edited_at >= :cutoffDate', { cutoffDate })
      .orderBy('log.edited_at', 'DESC')
      .take(limit)
      .getMany();
  }

  async getEditStatistics(startDate: Date, endDate: Date) {
    const byEditor = await this.createQueryBuilder('log')
      .select('log.edited_by_user_name', 'editor')
      .addSelect('COUNT(*)', 'count')
      .where('log.edited_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.edited_by_user_name')
      .getRawMany();

    const byField = await this.createQueryBuilder('log')
      .select('log.field_changed', 'field')
      .addSelect('COUNT(*)', 'count')
      .where('log.edited_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.field_changed')
      .getRawMany();

    const total = await this.count({
      where: {
        edited_at: Between(startDate, endDate),
      },
    });

    return {
      total,
      byEditor,
      byField,
    };
  }
}
