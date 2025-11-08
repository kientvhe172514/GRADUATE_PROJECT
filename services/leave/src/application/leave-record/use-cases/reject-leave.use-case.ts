import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { LEAVE_RECORD_REPOSITORY, LEAVE_BALANCE_REPOSITORY } from '../../tokens';
import { RejectLeaveDto, LeaveRecordResponseDto } from '../dto/leave-record.dto';

@Injectable()
export class RejectLeaveUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
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

    // 4. Restore balance: remove from pending_days and restore to remaining_days
    const year = leaveRecord.start_date.getFullYear();
    const balance = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
      leaveRecord.employee_id,
      leaveRecord.leave_type_id,
      year
    );

    if (balance) {
      await this.leaveBalanceRepository.update(balance.id, {
        pending_days: Number(balance.pending_days) - leaveRecord.total_leave_days,
        remaining_days: Number(balance.remaining_days) + leaveRecord.total_leave_days,
      });
    }

    // 5. Update leave record status
    const updated = await this.leaveRecordRepository.update(leaveRecordId, {
      status: 'REJECTED',
      approved_by: dto.rejected_by,
      approved_at: new Date(),
      rejection_reason: dto.rejection_reason,
    });

    return updated as LeaveRecordResponseDto;
  }
}

