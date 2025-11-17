import { EmployeeWorkSchedule } from '../../../domain/entities/employee-work-schedule.entity';
import { EmployeeWorkScheduleSchema } from '../typeorm/work-schedule.schema';

export class EmployeeWorkScheduleMapper {
  static toDomain(schema: EmployeeWorkScheduleSchema): EmployeeWorkSchedule {
    return new EmployeeWorkSchedule({
      id: schema.id,
      employee_id: schema.employee_id,
      work_schedule_id: schema.work_schedule_id,
      effective_from: schema.effective_from,
      effective_to: schema.effective_to,
      created_at: schema.created_at,
      created_by: schema.created_by,
    });
  }

  static toPersistence(domain: EmployeeWorkSchedule): Partial<EmployeeWorkScheduleSchema> {
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

