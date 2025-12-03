import { EmployeeWorkSchedule } from '../../../domain/entities/employee-work-schedule.entity';
import { EmployeeWorkScheduleSchema } from '../typeorm/employee-work-schedule.schema';
import { WorkScheduleSchema } from '../typeorm/work-schedule.schema';

interface EmployeeWorkScheduleWithRelation extends EmployeeWorkSchedule {
  work_schedule?: WorkScheduleSchema;
}

export class EmployeeWorkScheduleMapper {
  static toDomain(
    schema: EmployeeWorkScheduleSchema & { work_schedule?: WorkScheduleSchema },
  ): EmployeeWorkScheduleWithRelation {
    const domain = new EmployeeWorkSchedule({
      id: schema.id,
      employee_id: schema.employee_id,
      work_schedule_id: schema.work_schedule_id,
      // Ensure dates are Date objects (query builder may return strings)
      effective_from:
        typeof schema.effective_from === 'string'
          ? new Date(schema.effective_from)
          : schema.effective_from,
      // Map nullable DB columns to undefined to satisfy domain typings
      effective_to: schema.effective_to
        ? typeof schema.effective_to === 'string'
          ? new Date(schema.effective_to)
          : schema.effective_to
        : undefined,
      created_at:
        typeof schema.created_at === 'string'
          ? new Date(schema.created_at)
          : schema.created_at,
      created_by: schema.created_by ?? undefined,
    }) as EmployeeWorkScheduleWithRelation;

    // Attach work_schedule relation if present
    if (schema.work_schedule) {
      domain.work_schedule = schema.work_schedule;
    }

    return domain;
  }

  static toPersistence(
    domain: EmployeeWorkSchedule,
  ): Partial<EmployeeWorkScheduleSchema> {
    const props = domain.toJSON();
    return {
      id: props.id,
      employee_id: props.employee_id,
      work_schedule_id: props.work_schedule_id,
      effective_from: props.effective_from,
      effective_to: props.effective_to,
      created_by: props.created_by,
    };
  }
}
