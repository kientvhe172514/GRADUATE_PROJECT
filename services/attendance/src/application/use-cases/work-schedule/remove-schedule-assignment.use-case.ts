import { Injectable, Inject, Logger } from '@nestjs/common';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../tokens';
import {
  BusinessException,
  ApiResponseDto,
} from '@graduate-project/shared-common';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';
import { IEventPublisher } from '../../ports/event-publisher.port';

@Injectable()
export class RemoveScheduleAssignmentUseCase {
  private readonly logger = new Logger(RemoveScheduleAssignmentUseCase.name);

  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepository: IEmployeeWorkScheduleRepository,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(assignmentId: number): Promise<ApiResponseDto<void>> {
    this.logger.log(
      `🗑️ Attempting to remove schedule assignment ID: ${assignmentId}`,
    );

    // Find assignment
    const assignment =
      await this.employeeWorkScheduleRepository.findById(assignmentId);
    if (!assignment) {
      throw new BusinessException(
        'ASSIGNMENT_NOT_FOUND',
        'Schedule assignment not found.',
        404,
      );
    }

    const props = assignment.toJSON();
    this.logger.log(
      `📋 Found assignment: Employee ${props.employee_id}, Schedule ${props.work_schedule_id}`,
    );

    // Delete all future shifts (not yet checked in)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deletedShifts =
      await this.employeeShiftRepository.deleteFutureShiftsByAssignment(
        props.employee_id,
        props.work_schedule_id,
        today,
      );

    this.logger.log(
      `🗑️ Deleted ${deletedShifts} future shifts for employee ${props.employee_id}`,
    );

    // Delete assignment
    await this.employeeWorkScheduleRepository.delete(assignmentId);

    this.logger.log(
      `✅ Successfully removed assignment ID ${assignmentId} and ${deletedShifts} future shifts`,
    );

    // Publish shift unassigned event
    try {
      await this.eventPublisher.publish({
        pattern: 'shift.unassigned',
        data: {
          employeeId: props.employee_id,
          workScheduleId: props.work_schedule_id,
          assignmentId: assignmentId,
          deletedShiftsCount: deletedShifts,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to publish shift.unassigned event:`, error);
    }

    return ApiResponseDto.success(
      undefined,
      `Schedule assignment removed successfully. ${deletedShifts} future shifts deleted.`,
    );
  }
}
