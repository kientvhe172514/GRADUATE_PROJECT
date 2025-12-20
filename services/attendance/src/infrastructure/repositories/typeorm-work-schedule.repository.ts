import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { WorkScheduleSchema } from '../persistence/typeorm/work-schedule.schema';
import { EmployeeWorkScheduleSchema } from '../persistence/typeorm/employee-work-schedule.schema';
import {
  IWorkScheduleRepository,
  IEmployeeWorkScheduleRepository,
} from '../../application/ports/work-schedule.repository.port';
import { WorkSchedule } from '../../domain/entities/work-schedule.entity';
import { EmployeeWorkSchedule } from '../../domain/entities/employee-work-schedule.entity';
import { WorkScheduleMapper } from '../persistence/mappers/work-schedule.mapper';
import { EmployeeWorkScheduleMapper } from '../persistence/mappers/employee-work-schedule.mapper';
import { ListWorkScheduleDto } from '../../application/dtos/work-schedule.dto';

@Injectable()
export class TypeOrmWorkScheduleRepository implements IWorkScheduleRepository {
  private readonly repository: Repository<WorkScheduleSchema>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(WorkScheduleSchema);
  }

  async save(schedule: WorkSchedule): Promise<WorkSchedule> {
    const persistenceEntity = WorkScheduleMapper.toPersistence(schedule);
    const savedSchema = await this.repository.save(persistenceEntity);
    return WorkScheduleMapper.toDomain(savedSchema);
  }

  async findById(id: number): Promise<WorkSchedule | null> {
    const schema = await this.repository.findOneBy({ id });
    return schema ? WorkScheduleMapper.toDomain(schema) : null;
  }

  async findByName(name: string): Promise<WorkSchedule | null> {
    const schema = await this.repository.findOneBy({ schedule_name: name });
    return schema ? WorkScheduleMapper.toDomain(schema) : null;
  }

  async findAll(
    options: ListWorkScheduleDto,
  ): Promise<{ data: WorkSchedule[]; total: number }> {
    const where: any = {};
    if (options.status) where.status = options.status;
    if (options.schedule_type) where.schedule_type = options.schedule_type;

    const [schemas, total] = await this.repository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      take: options.limit,
      skip: options.offset,
    });

    return {
      data: schemas.map(WorkScheduleMapper.toDomain),
      total,
    };
  }
}

@Injectable()
export class TypeOrmEmployeeWorkScheduleRepository
  implements IEmployeeWorkScheduleRepository
{
  private readonly repository: Repository<EmployeeWorkScheduleSchema>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(EmployeeWorkScheduleSchema);
  }

  async save(assignment: EmployeeWorkSchedule): Promise<EmployeeWorkSchedule> {
    const persistenceEntity =
      EmployeeWorkScheduleMapper.toPersistence(assignment);
    const savedSchema = await this.repository.save(persistenceEntity);
    return EmployeeWorkScheduleMapper.toDomain(savedSchema);
  }

  async saveMany(
    assignments: EmployeeWorkSchedule[],
  ): Promise<EmployeeWorkSchedule[]> {
    const persistenceEntities = assignments.map(
      EmployeeWorkScheduleMapper.toPersistence,
    );
    const savedSchemas = await this.repository.save(persistenceEntities);
    return savedSchemas.map(EmployeeWorkScheduleMapper.toDomain);
  }

  async findByEmployeeIdAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeWorkSchedule | null> {
    const dateStr = date.toISOString().split('T')[0];

    const schema = await this.repository
      .createQueryBuilder('ews')
      // include work_schedule relation to allow callers to inspect scheduled times
      .leftJoinAndSelect('ews.work_schedule', 'ws')
      .where('ews.employee_id = :employeeId', { employeeId })
      .andWhere('ews.effective_from <= :date', { date: dateStr })
      .andWhere('(ews.effective_to IS NULL OR ews.effective_to >= :date)', {
        date: dateStr,
      })
      .orderBy('ews.effective_from', 'DESC')
      .getOne();

    return schema ? EmployeeWorkScheduleMapper.toDomain(schema) : null;
  }

  async findAssignmentsByScheduleId(
    scheduleId: number,
  ): Promise<EmployeeWorkSchedule[]> {
    const schemas = await this.repository.findBy({
      work_schedule_id: scheduleId,
    });
    return schemas.map(EmployeeWorkScheduleMapper.toDomain);
  }

  async findAssignmentsByEmployeeId(
    employeeId: number,
  ): Promise<EmployeeWorkSchedule[]> {
    const schemas = await this.repository.find({
      where: { employee_id: employeeId },
      relations: ['work_schedule'],
      order: { effective_from: 'DESC' },
    });
    return schemas.map(EmployeeWorkScheduleMapper.toDomain);
  }

  async findById(id: number): Promise<EmployeeWorkSchedule | null> {
    const schema = await this.repository.findOne({ where: { id } });
    return schema ? EmployeeWorkScheduleMapper.toDomain(schema) : null;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async update(
    id: number,
    assignment: Partial<EmployeeWorkSchedule>,
  ): Promise<EmployeeWorkSchedule> {
    const props = assignment.toJSON ? assignment.toJSON() : assignment;
    await this.repository.update(id, {
      effective_from: props.effective_from,
      effective_to: props.effective_to,
    });
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Assignment not found after update');
    }
    return EmployeeWorkScheduleMapper.toDomain(updated);
  }

  /**
   * Find all assignments that have pending schedule overrides for a specific date
   * Used by cronjob to process overrides and create shifts
   */
  async findPendingOverridesForDate(
    date: string,
  ): Promise<EmployeeWorkSchedule[]> {
    const schemas = await this.repository
      .createQueryBuilder('ews')
      .where(
        `EXISTS (
        SELECT 1 FROM jsonb_array_elements(ews.schedule_overrides) AS override
        WHERE override->>'status' = :status
        AND override->>'from_date' <= :date
        AND (override->>'to_date' IS NULL OR override->>'to_date' >= :date)
      )`,
        { status: 'PENDING', date },
      )
      .getMany();

    return schemas.map((schema) => EmployeeWorkScheduleMapper.toDomain(schema));
  }

  /**
   * Find assignments for multiple employees (bulk fetch)
   * Used to efficiently query multiple employee schedules at once
   */
  async findAssignmentsByEmployeeIds(
    employeeIds: number[],
  ): Promise<EmployeeWorkSchedule[]> {
    if (employeeIds.length === 0) {
      return [];
    }

    const schemas = await this.repository.find({
      where: { employee_id: In(employeeIds) },
      relations: ['work_schedule'],
      order: { employee_id: 'ASC', effective_from: 'DESC' },
    });

    return schemas.map((schema) => EmployeeWorkScheduleMapper.toDomain(schema));
  }

  /**
   * Find all assignments with pagination
   * Used for calendar view when no filters are provided
   */
  async findAllAssignments(
    limit: number,
    offset: number,
  ): Promise<{ data: EmployeeWorkSchedule[]; total: number }> {
    const [schemas, total] = await this.repository.findAndCount({
      relations: ['work_schedule'],
      order: { employee_id: 'ASC', effective_from: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: schemas.map((schema) =>
        EmployeeWorkScheduleMapper.toDomain(schema),
      ),
      total,
    };
  }
}
