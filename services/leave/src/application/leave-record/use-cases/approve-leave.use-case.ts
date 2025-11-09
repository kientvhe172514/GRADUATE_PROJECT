import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { LEAVE_RECORD_REPOSITORY, LEAVE_BALANCE_REPOSITORY } from '../../tokens';
import { ApproveLeaveDto, LeaveRecordResponseDto } from '../dto/leave-record.dto';

@Injectable()
export class ApproveLeaveUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
  ) {}

  async execute(leaveRecordId: number, dto: ApproveLeaveDto): Promise<LeaveRecordResponseDto> {
    // 1. Get leave record
    const leaveRecord = await this.leaveRecordRepository.findById(leaveRecordId);
    if (!leaveRecord) {
      throw new BusinessException(
        ErrorCodes.LEAVE_RECORD_NOT_FOUND,
        'Leave record not found',
        404,
      );
    }

    // 2. Check if already approved
    if (leaveRecord.status === 'APPROVED') {
      throw new BusinessException(
        ErrorCodes.LEAVE_ALREADY_APPROVED,
        'Leave request has already been approved',
        400,
      );
    }

    // 3. Check if not pending
    if (leaveRecord.status !== 'PENDING') {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        `Cannot approve leave request with status: ${leaveRecord.status}`,
        400,
      );
    }

    // 4. Update balance: pending_days -> used_days
    const year = new Date(leaveRecord.start_date).getFullYear();
    const balance = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
      leaveRecord.employee_id,
      leaveRecord.leave_type_id,
      year
    );

    if (balance) {
      const leaveDays = Number(leaveRecord.total_leave_days);
      const newPendingDays = Number(balance.pending_days) - leaveDays;
      const newUsedDays = Number(balance.used_days) + leaveDays;
      
      await this.leaveBalanceRepository.update(balance.id, {
        pending_days: newPendingDays,
        used_days: newUsedDays,
      });
    }

    // 5. Update leave record status
    const updated = await this.leaveRecordRepository.update(leaveRecordId, {
      status: 'APPROVED',
      approved_by: dto.approved_by,
      approved_at: new Date(),
    });

    return updated as LeaveRecordResponseDto;
  }
}

