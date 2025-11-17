import { Injectable } from '@nestjs/common';
import {
  WorkScheduleRepository,
  EmployeeWorkScheduleRepository,
} from '../../../infrastructure/repositories/work-schedule.repository';

export interface CreateWorkScheduleCommand {
  schedule_name: string;
  schedule_type: string;
  work_days?: string;
  start_time?: string;
  end_time?: string;
  break_duration_minutes?: number;
  late_tolerance_minutes?: number;
  early_leave_tolerance_minutes?: number;
  status?: string;
  created_by: number;
}

@Injectable()
export class CreateWorkScheduleUseCase {
  constructor(
    private readonly workScheduleRepository: WorkScheduleRepository,
  ) {}

  async execute(command: CreateWorkScheduleCommand) {
    const schedule = await this.workScheduleRepository.createSchedule(
      {
        schedule_name: command.schedule_name,
        schedule_type: command.schedule_type,
        work_days: command.work_days,
        start_time: command.start_time,
        end_time: command.end_time,
        break_duration_minutes: command.break_duration_minutes ?? 60,
        late_tolerance_minutes: command.late_tolerance_minutes ?? 15,
        early_leave_tolerance_minutes:
          command.early_leave_tolerance_minutes ?? 15,
        status: command.status ?? 'ACTIVE',
      },
      command.created_by,
    );

    return {
      success: true,
      message: 'Work schedule created successfully',
      data: schedule,
    };
  }
}
