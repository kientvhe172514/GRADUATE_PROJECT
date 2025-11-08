import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { LEAVE_RECORD_REPOSITORY, LEAVE_TYPE_REPOSITORY, LEAVE_BALANCE_REPOSITORY } from '../../tokens';
import { CreateLeaveRequestDto, LeaveRecordResponseDto } from '../dto/leave-record.dto';
import { LeaveRecordEntity } from '../../../domain/entities/leave-record.entity';

@Injectable()
export class CreateLeaveRequestUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
  ) {}

  async execute(dto: CreateLeaveRequestDto): Promise<LeaveRecordResponseDto> {
    // 1. Validate leave type exists
    const leaveType = await this.leaveTypeRepository.findById(dto.leave_type_id);
    if (!leaveType) {
      throw new BusinessException(
        ErrorCodes.LEAVE_TYPE_NOT_FOUND,
        'Leave type not found',
        404,
      );
    }

    // 2. Validate date range
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);
    
    if (startDate > endDate) {
      throw new BusinessException(
        ErrorCodes.INVALID_LEAVE_DATE_RANGE,
        'Start date must be before or equal to end date',
        400,
      );
    }

    // 3. Check for overlapping leave requests
    const overlappingLeaves = await this.leaveRecordRepository.findByDateRange(startDate, endDate);
    const hasOverlap = overlappingLeaves.some(
      leave => leave.employee_id === dto.employee_id && 
               (leave.status === 'PENDING' || leave.status === 'APPROVED')
    );

    if (hasOverlap) {
      throw new BusinessException(
        ErrorCodes.LEAVE_REQUEST_OVERLAPS,
        'You already have a pending or approved leave request during this period',
        400,
      );
    }

    // 4. Calculate leave days
    const totalCalendarDays = this.calculateCalendarDays(startDate, endDate);
    const totalWorkingDays = this.calculateWorkingDays(startDate, endDate, dto.is_half_day_start, dto.is_half_day_end);
    const totalLeaveDays = totalWorkingDays; // Can be adjusted based on leave type rules

    // 5. Check leave balance if leave type deducts from balance
    if (leaveType.deducts_from_balance) {
      const year = startDate.getFullYear();
      const balance = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
        dto.employee_id,
        dto.leave_type_id,
        year
      );

      if (!balance) {
        throw new BusinessException(
          ErrorCodes.LEAVE_BALANCE_NOT_FOUND,
          'Leave balance not found. Please contact HR to initialize your leave balance.',
          404,
        );
      }

      if (balance.remaining_days < totalLeaveDays) {
        throw new BusinessException(
          ErrorCodes.INSUFFICIENT_LEAVE_BALANCE,
          `Insufficient leave balance. Required: ${totalLeaveDays} days, Available: ${balance.remaining_days} days`,
          400,
        );
      }

      // Update pending_days in balance
      await this.leaveBalanceRepository.update(balance.id, {
        pending_days: Number(balance.pending_days) + totalLeaveDays,
        remaining_days: Number(balance.remaining_days) - totalLeaveDays,
      });
    }

    // 6. Create leave record
    const leaveRecord = new LeaveRecordEntity({
      ...dto,
      start_date: startDate,
      end_date: endDate,
      total_calendar_days: totalCalendarDays,
      total_working_days: totalWorkingDays,
      total_leave_days: totalLeaveDays,
      status: 'PENDING',
      requested_at: new Date(),
      approval_level: 1,
      current_approver_id: undefined, // TODO: Set based on approval workflow
    });

    const created = await this.leaveRecordRepository.create(leaveRecord);
    return created as LeaveRecordResponseDto;
  }

  private calculateCalendarDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  private calculateWorkingDays(
    startDate: Date, 
    endDate: Date, 
    isHalfDayStart: boolean, 
    isHalfDayEnd: boolean
  ): number {
    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Adjust for half days
    if (isHalfDayStart) workingDays -= 0.5;
    if (isHalfDayEnd) workingDays -= 0.5;

    return workingDays;
  }
}

