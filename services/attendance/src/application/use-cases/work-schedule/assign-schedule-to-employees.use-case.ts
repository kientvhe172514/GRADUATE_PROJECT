import { Injectable, Inject } from '@nestjs/common';
import { AssignWorkScheduleDto } from '../../dtos/work-schedule.dto';
import {
  IWorkScheduleRepository,
  IEmployeeWorkScheduleRepository,
} from '../../ports/work-schedule.repository.port';
import {
  WORK_SCHEDULE_REPOSITORY,
  EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
} from '../../../application/tokens';
import {
  BusinessException,
  ErrorCodes,
  ApiResponseDto,
} from '@graduate-project/shared-common';
import { JwtPayload } from '@graduate-project/shared-common';
import { EmployeeWorkSchedule } from '../../../domain/entities/employee-work-schedule.entity';

@Injectable()
export class AssignScheduleToEmployeesUseCase {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepository: IEmployeeWorkScheduleRepository,
  ) {}

  async execute(
    scheduleId: number,
    dto: AssignWorkScheduleDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    const workSchedule = await this.workScheduleRepository.findById(scheduleId);
    if (!workSchedule) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_NOT_FOUND,
        'Work schedule not found.',
        404,
      );
    }

    const assignments = dto.employee_ids.map((employeeId) => {
      return new EmployeeWorkSchedule({
        employee_id: employeeId,
        work_schedule_id: scheduleId,
        effective_from: new Date(dto.effective_from),
        effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
        created_by: currentUser.sub,
      });
    });

    await this.employeeWorkScheduleRepository.saveMany(assignments);

    return ApiResponseDto.success(
      undefined,
      'Work schedule assigned to employees successfully.',
    );
  }
}
