import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { EventPublisherPort } from '../../ports/event.publisher.port';
import { LEAVE_RECORD_REPOSITORY, LEAVE_TYPE_REPOSITORY, EVENT_PUBLISHER } from '../../tokens';
import { UpdateLeaveRecordDto, LeaveRecordResponseDto } from '../dto/leave-record.dto';

@Injectable()
export class UpdateLeaveRequestUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(id: number, dto: UpdateLeaveRecordDto): Promise<LeaveRecordResponseDto> {
    // 1. Get leave record
    const leaveRecord = await this.leaveRecordRepository.findById(id);
    if (!leaveRecord) {
      throw new BusinessException(
        ErrorCodes.LEAVE_RECORD_NOT_FOUND,
        'Leave record not found',
        404,
      );
    }

    // 2. Only PENDING requests can be updated
    if (leaveRecord.status !== 'PENDING') {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        `Cannot update leave request with status: ${leaveRecord.status}. Only PENDING requests can be modified.`,
        400,
      );
    }

    // 3. Validate date range if dates are being updated
    if (dto.start_date && dto.end_date) {
      const startDate = new Date(dto.start_date);
      const endDate = new Date(dto.end_date);
      
      if (startDate > endDate) {
        throw new BusinessException(
          ErrorCodes.INVALID_LEAVE_DATE_RANGE,
          'Start date must be before or equal to end date',
          400,
        );
      }
    }

    // 4. Update leave record
    const updateData: any = { ...dto };
    
    // Convert date strings to Date objects if provided
    if (dto.start_date) updateData.start_date = new Date(dto.start_date);
    if (dto.end_date) updateData.end_date = new Date(dto.end_date);

    // TODO: Recalculate days if dates are changed
    // This would require re-checking balance, etc.

    const updated = await this.leaveRecordRepository.update(id, updateData);

    // 5. Get leave type for notification
    const leaveType = await this.leaveTypeRepository.findById(updated.leave_type_id);

    // 6. Publish event to notify managers about the update
    this.eventPublisher.publish('leave.updated', {
      leaveId: updated.id,
      employeeId: updated.employee_id,
      employeeCode: updated.employee_code,
      departmentId: updated.department_id,
      leaveTypeId: leaveType?.id,
      leaveType: leaveType?.leave_type_name || 'Leave',
      leaveTypeCode: leaveType?.leave_type_code,
      startDate: updated.start_date instanceof Date
        ? updated.start_date.toISOString().split('T')[0]
        : new Date(updated.start_date).toISOString().split('T')[0],
      endDate: updated.end_date instanceof Date
        ? updated.end_date.toISOString().split('T')[0]
        : new Date(updated.end_date).toISOString().split('T')[0],
      totalLeaveDays: updated.total_leave_days,
      status: updated.status,
      updatedFields: Object.keys(dto),
      recipientType: 'MANAGER', // Notify HR_MANAGER or DEPARTMENT_MANAGER
    });

    return updated as LeaveRecordResponseDto;
  }
}

