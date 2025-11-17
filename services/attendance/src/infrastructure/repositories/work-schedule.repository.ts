import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  WorkScheduleSchema,
  EmployeeWorkScheduleSchema,
} from '../persistence/typeorm/work-schedule.schema';
import {
  WorkScheduleEntity,
  EmployeeWorkScheduleEntity,
} from '../persistence/entities/work-schedule.entity';

@Injectable()
export class WorkScheduleRepository extends Repository<WorkScheduleSchema> {
  constructor(private dataSource: DataSource) {
    super(WorkScheduleSchema, dataSource.createEntityManager());
  }

  async findAllSchedules(
    status?: string,
    scheduleType?: string,
    limit = 20,
    offset = 0,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (scheduleType) where.schedule_type = scheduleType;

    return this.find({
      where,
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findActiveSchedules() {
    return this.find({
      where: { status: 'ACTIVE' },
      order: { schedule_name: 'ASC' },
    });
  }

  async createSchedule(
    data: Partial<WorkScheduleEntity>,
    createdBy: number,
  ): Promise<WorkScheduleSchema> {
    const schedule = this.create({
      ...data,
      created_by: createdBy,
      updated_by: createdBy,
    } as any);
    const saved = await this.save(schedule);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateSchedule(
    id: number,
    data: Partial<WorkScheduleEntity>,
    updatedBy: number,
  ): Promise<boolean> {
    const result = await this.update(id, {
      ...data,
      updated_by: updatedBy,
      updated_at: new Date(),
    } as any);
    return (result.affected ?? 0) > 0;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = await this.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async countSchedules(status?: string): Promise<number> {
    const where: any = {};
    if (status) where.status = status;
    return this.count({ where });
  }
}

@Injectable()
export class EmployeeWorkScheduleRepository extends Repository<EmployeeWorkScheduleSchema> {
  constructor(private dataSource: DataSource) {
    super(EmployeeWorkScheduleSchema, dataSource.createEntityManager());
  }

  async findByEmployeeId(
    employeeId: number,
    activeOnly = true,
  ): Promise<EmployeeWorkScheduleSchema[]> {
    const query = this.createQueryBuilder('ews').where(
      'ews.employee_id = :employeeId',
      { employeeId },
    );

    if (activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      query
        .andWhere('ews.effective_from <= :today', { today })
        .andWhere('(ews.effective_to IS NULL OR ews.effective_to >= :today)', {
          today,
        });
    }

    return query.orderBy('ews.effective_from', 'DESC').getMany();
  }

  async findActiveScheduleForEmployee(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeWorkScheduleSchema | null> {
    const dateStr = date.toISOString().split('T')[0];

    return this.createQueryBuilder('ews')
      .where('ews.employee_id = :employeeId', { employeeId })
      .andWhere('ews.effective_from <= :date', { date: dateStr })
      .andWhere('(ews.effective_to IS NULL OR ews.effective_to >= :date)', {
        date: dateStr,
      })
      .orderBy('ews.effective_from', 'DESC')
      .getOne();
  }

  async assignScheduleToEmployees(
    employeeIds: number[],
    scheduleId: number,
    effectiveFrom: Date,
    effectiveTo: Date | null,
    createdBy: number,
  ): Promise<any[]> {
    const assignments = employeeIds.map((employeeId) =>
      this.create({
        employee_id: employeeId,
        work_schedule_id: scheduleId,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_by: createdBy,
      } as any),
    );

    return this.save(assignments as any);
  }

  async endScheduleAssignment(id: number, effectiveTo: Date): Promise<boolean> {
    const result = await this.update(id, { effective_to: effectiveTo } as any);
    return (result.affected ?? 0) > 0;
  }

  async findByScheduleId(
    scheduleId: number,
  ): Promise<EmployeeWorkScheduleSchema[]> {
    return this.find({
      where: { work_schedule_id: scheduleId },
      order: { effective_from: 'DESC' },
    });
  }

  async countEmployeesOnSchedule(scheduleId: number): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    return this.createQueryBuilder('ews')
      .where('ews.work_schedule_id = :scheduleId', { scheduleId })
      .andWhere('ews.effective_from <= :today', { today })
      .andWhere('(ews.effective_to IS NULL OR ews.effective_to >= :today)', {
        today,
      })
      .getCount();
  }
}
