import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { LEAVE_RECORD_REPOSITORY, LEAVE_BALANCE_REPOSITORY } from '../../tokens';
import { CancelLeaveDto, LeaveRecordResponseDto } from '../dto/leave-record.dto';

@Injectable()
export class CancelLeaveUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
  ) {}

  async execute(leaveRecordId: number, dto: CancelLeaveDto): Promise<LeaveRecordResponseDto> {
    // 1. Get leave record
    const leaveRecord = await this.leaveRecordRepository.findById(leaveRecordId);
    if (!leaveRecord) {
      throw new BusinessException(
        ErrorCodes.LEAVE_RECORD_NOT_FOUND,
        'Leave record not found',
        404,
      );
    }

    // 2. Check if can be cancelled
    if (leaveRecord.status === 'CANCELLED') {
      throw new BusinessException(
        ErrorCodes.LEAVE_CANNOT_BE_CANCELLED,
        'Leave request has already been cancelled',
        400,
      );
    }

    if (leaveRecord.status === 'REJECTED') {
      throw new BusinessException(
        ErrorCodes.LEAVE_CANNOT_BE_CANCELLED,
        'Cannot cancel a rejected leave request',
        400,
      );
    }

    // 3. Check if leave has already started
    const now = new Date();
    const startDate = new Date(leaveRecord.start_date);
    if (startDate < now) {
      throw new BusinessException(
        ErrorCodes.LEAVE_CANNOT_BE_CANCELLED,
        'Cannot cancel a leave that has already started',
        400,
      );
    }

    // 4. Restore balance based on current status
    const year = leaveRecord.start_date.getFullYear();
    const balance = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
      leaveRecord.employee_id,
      leaveRecord.leave_type_id,
      year
    );

    if (balance) {
      if (leaveRecord.status === 'PENDING') {
        // Restore from pending_days
        await this.leaveBalanceRepository.update(balance.id, {
          pending_days: Number(balance.pending_days) - leaveRecord.total_leave_days,
          remaining_days: Number(balance.remaining_days) + leaveRecord.total_leave_days,
        });
      } else if (leaveRecord.status === 'APPROVED') {
        // Restore from used_days
        await this.leaveBalanceRepository.update(balance.id, {
          used_days: Number(balance.used_days) - leaveRecord.total_leave_days,
          remaining_days: Number(balance.remaining_days) + leaveRecord.total_leave_days,
        });
      }
    }

    // 5. Update leave record status
    const updated = await this.leaveRecordRepository.update(leaveRecordId, {
      status: 'CANCELLED',
      cancelled_at: new Date(),
      cancellation_reason: dto.cancellation_reason,
    });

    return updated as LeaveRecordResponseDto;
  }
}

