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

  /**
   * Find ALL active work schedules for an employee on a specific date
   * Used for overtime validation to check overlap with all assigned schedules
   */
  async findAllByEmployeeIdAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeWorkSchedule[]> {
    const dateStr = date.toISOString().split('T')[0];

    const schemas = await this.repository
      .createQueryBuilder('ews')
      // include work_schedule relation to allow callers to inspect scheduled times
      .leftJoinAndSelect('ews.work_schedule', 'ws')
      .where('ews.employee_id = :employeeId', { employeeId })
      .andWhere('ews.effective_from <= :date', { date: dateStr })
      .andWhere('(ews.effective_to IS NULL OR ews.effective_to >= :date)', {
        date: dateStr,
      })
      .orderBy('ews.effective_from', 'DESC')
      .getMany();

    return schemas.map((schema) => EmployeeWorkScheduleMapper.toDomain(schema));
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
    
    // Populate override_work_schedule details for each assignment
    const result: any[] = [];
    for (const schema of schemas) {
      const domain = EmployeeWorkScheduleMapper.toDomain(schema);
      
      // If has schedule_overrides with override_work_schedule_id, fetch those schedules
      let enrichedOverrides = domain.schedule_overrides || [];
      if (enrichedOverrides && Array.isArray(enrichedOverrides) && enrichedOverrides.length > 0) {
        enrichedOverrides = await Promise.all(
          enrichedOverrides.map(async (override: any) => {
            if (override.type === 'SCHEDULE_CHANGE' && override.override_work_schedule_id) {
              const overrideSchedule = await this.findWorkScheduleById(override.override_work_schedule_id);
              if (overrideSchedule) {
                return {
                  ...override,
                  override_work_schedule: {
                    id: overrideSchedule.id,
                    schedule_name: overrideSchedule.schedule_name,
                    schedule_type: overrideSchedule.schedule_type,
                    start_time: overrideSchedule.start_time,
                    end_time: overrideSchedule.end_time,
                    break_duration_minutes: overrideSchedule.break_duration_minutes,
                    late_tolerance_minutes: overrideSchedule.late_tolerance_minutes,
                    early_leave_tolerance_minutes: overrideSchedule.early_leave_tolerance_minutes,
                    status: overrideSchedule.status,
                  },
                };
              }
            }
            return override;
          }),
        );
      }
      
      // Return plain object with enriched overrides instead of modifying domain entity
      const plainObject = {
        id: domain.id,
        employee_id: domain.employee_id,
        work_schedule_id: domain.work_schedule_id,
        effective_from: domain.effective_from,
        effective_to: domain.effective_to,
        work_schedule: (domain as any).work_schedule,
        schedule_overrides: enrichedOverrides,
      };
      
      result.push(plainObject as any);
    }
    
    return result as any;
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

  /**
   * Find work schedule by ID (for override validation)
   * Returns basic schedule info needed for overlap checking
   */
  async findWorkScheduleById(scheduleId: number): Promise<WorkSchedule | null> {
    const scheduleRepo = this.dataSource.getRepository(WorkScheduleSchema);
    const schema = await scheduleRepo.findOneBy({ id: scheduleId });
    return schema ? WorkScheduleMapper.toDomain(schema) : null;
  }
}
