import { WorkSchedule } from '../../domain/entities/work-schedule.entity';
import { EmployeeWorkSchedule } from '../../domain/entities/employee-work-schedule.entity';
import { ListWorkScheduleDto } from '../dtos/work-schedule.dto';

export interface IWorkScheduleRepository {
  save(schedule: WorkSchedule): Promise<WorkSchedule>;
  findById(id: number): Promise<WorkSchedule | null>;
  findByName(name: string): Promise<WorkSchedule | null>;
  findAll(
    options: ListWorkScheduleDto,
  ): Promise<{ data: WorkSchedule[]; total: number }>;
}

export interface IEmployeeWorkScheduleRepository {
  save(assignment: EmployeeWorkSchedule): Promise<EmployeeWorkSchedule>;
  saveMany(
    assignments: EmployeeWorkSchedule[],
  ): Promise<EmployeeWorkSchedule[]>;
  findByEmployeeIdAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeWorkSchedule | null>;
  findAssignmentsByScheduleId(
    scheduleId: number,
  ): Promise<EmployeeWorkSchedule[]>;
  findAssignmentsByEmployeeId(
    employeeId: number,
  ): Promise<EmployeeWorkSchedule[]>;
  findById(id: number): Promise<EmployeeWorkSchedule | null>;
  delete(id: number): Promise<void>;
  update(
    id: number,
    assignment: Partial<EmployeeWorkSchedule>,
  ): Promise<EmployeeWorkSchedule>;

  // Schedule override methods
  findPendingOverridesForDate(
    date: string,
  ): Promise<EmployeeWorkSchedule[]>;
  findAssignmentsByEmployeeIds(
    employeeIds: number[],
  ): Promise<EmployeeWorkSchedule[]>;
}
