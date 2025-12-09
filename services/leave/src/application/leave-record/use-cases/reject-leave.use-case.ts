import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../ports/leave-balance-transaction.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { EventPublisherPort } from '../../ports/event.publisher.port';
import {
  LEAVE_RECORD_REPOSITORY,
  LEAVE_BALANCE_REPOSITORY,
  LEAVE_BALANCE_TRANSACTION_REPOSITORY,
  LEAVE_TYPE_REPOSITORY,
  EVENT_PUBLISHER,
} from '../../tokens';
import { RejectLeaveDto, LeaveRecordResponseDto } from '../dto/leave-record.dto';

@Injectable()
export class RejectLeaveUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ILeaveBalanceTransactionRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(leaveRecordId: number, dto: RejectLeaveDto): Promise<LeaveRecordResponseDto> {
    // 1. Get leave record
    const leaveRecord = await this.leaveRecordRepository.findById(leaveRecordId);
    if (!leaveRecord) {
      throw new BusinessException(
        ErrorCodes.LEAVE_RECORD_NOT_FOUND,
        'Leave record not found',
        404,
      );
    }

    // 2. Check if already rejected
    if (leaveRecord.status === 'REJECTED') {
      throw new BusinessException(
        ErrorCodes.LEAVE_ALREADY_REJECTED,
        'Leave request has already been rejected',
        400,
      );
    }

    // 3. Check if not pending
    if (leaveRecord.status !== 'PENDING') {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        `Cannot reject leave request with status: ${leaveRecord.status}`,
        400,
      );
    }

    // 4. No balance update needed - balance was not deducted when request was created
    // Just record the rejection transaction for audit trail
    const year = new Date(leaveRecord.start_date).getFullYear();
    const balance = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
      leaveRecord.employee_id,
      leaveRecord.leave_type_id,
      year,
    );

    if (balance) {
      const leaveDays = Number(leaveRecord.total_leave_days);
      const balanceBefore = Number(balance.remaining_days);

      // 4.1. Record transaction for audit trail (no balance change)
      await this.transactionRepository.create({
        employee_id: leaveRecord.employee_id,
        leave_type_id: leaveRecord.leave_type_id,
        year: year,
        transaction_type: 'LEAVE_REJECTED',
        amount: 0, // No balance change on rejection
        balance_before: balanceBefore,
        balance_after: balanceBefore, // Balance unchanged
        reference_type: 'LEAVE_RECORD',
        reference_id: leaveRecordId,
        description: `Leave rejected (${leaveDays} days): ${dto.rejection_reason || 'No reason provided'}`,
        created_by: dto.rejected_by,
      });
    }

    // 5. Update leave record status
    const updated = await this.leaveRecordRepository.update(leaveRecordId, {
      status: 'REJECTED',
      approved_by: dto.rejected_by,
      approved_at: new Date(),
      rejection_reason: dto.rejection_reason,
    });

    // 6. Get leave type for notification
    const leaveType = await this.leaveTypeRepository.findById(updated.leave_type_id);

    // 7. Publish event to notify employee
    this.eventPublisher.publish('leave.rejected', {
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
      reason: dto.rejection_reason,
      rejectedBy: dto.rejected_by,
      rejectedAt: updated.approved_at?.toISOString(),
      recipientType: 'EMPLOYEE', // Notify the employee who requested the leave
    });

    return updated as LeaveRecordResponseDto;
  }
}

