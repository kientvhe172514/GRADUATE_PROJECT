import { WorkSchedule } from '../../../domain/entities/work-schedule.entity';
import { WorkScheduleSchema } from '../typeorm/work-schedule.schema';

export class WorkScheduleMapper {
  static toDomain(schema: WorkScheduleSchema): WorkSchedule {
    return new WorkSchedule({
      id: schema.id,
      schedule_name: schema.schedule_name,
      schedule_type: schema.schedule_type as any,
      work_days: schema.work_days,
      start_time: schema.start_time,
      end_time: schema.end_time,
      break_duration_minutes: schema.break_duration_minutes,
      late_tolerance_minutes: schema.late_tolerance_minutes,
      early_leave_tolerance_minutes: schema.early_leave_tolerance_minutes,
      status: schema.status as any,
      created_at: schema.created_at,
      created_by: schema.created_by,
      updated_at: schema.updated_at,
      updated_by: schema.updated_by,
    });
  }

  static toPersistence(domain: WorkSchedule): Partial<WorkScheduleSchema> {
    const props = domain.toJSON();
    return {
      id: props.id,
      schedule_name: props.schedule_name,
      schedule_type: props.schedule_type,
      work_days: props.work_days,
      start_time: props.start_time,
      end_time: props.end_time,
      break_duration_minutes: props.break_duration_minutes,
      late_tolerance_minutes: props.late_tolerance_minutes,
      early_leave_tolerance_minutes: props.early_leave_tolerance_minutes,
      status: props.status,
      created_by: props.created_by,
      updated_by: props.updated_by,
    };
  }
}
