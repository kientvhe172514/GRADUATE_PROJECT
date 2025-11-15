import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { LeaveRecordEntity } from '../../../domain/entities/leave-record.entity';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { LEAVE_RECORD_REPOSITORY } from '../../tokens';

export interface GetMyLeavesFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  leave_type_id?: number;
  start_date?: Date;
  end_date?: Date;
  year?: number;
}

@Injectable()
export class GetMyLeavesUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
  ) {}

  async execute(
    employeeId: number,
    filters?: GetMyLeavesFilters,
  ): Promise<ApiResponseDto<LeaveRecordEntity[]>> {
    // Get all leaves for this employee
    const leaves =
      await this.leaveRecordRepository.findByEmployeeId(employeeId);

    if (!leaves || leaves.length === 0) {
      return ApiResponseDto.success(
        [],
        'No leave records found for this employee',
      );
    }

    // Apply filters
    let filteredLeaves = leaves;

    if (filters) {
      if (filters.status) {
        filteredLeaves = filteredLeaves.filter(
          (leave) => leave.status === filters.status,
        );
      }

      if (filters.leave_type_id) {
        filteredLeaves = filteredLeaves.filter(
          (leave) => leave.leave_type_id === filters.leave_type_id,
        );
      }

      if (filters.start_date) {
        filteredLeaves = filteredLeaves.filter(
          (leave) => new Date(leave.end_date) >= filters.start_date!,
        );
      }

      if (filters.end_date) {
        filteredLeaves = filteredLeaves.filter(
          (leave) => new Date(leave.start_date) <= filters.end_date!,
        );
      }

      if (filters.year) {
        filteredLeaves = filteredLeaves.filter((leave) => {
          const leaveYear = new Date(leave.start_date).getFullYear();
          return leaveYear === filters.year;
        });
      }
    }

    // Sort by created_at DESC (newest first)
    filteredLeaves.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return ApiResponseDto.success(
      filteredLeaves,
      `Found ${filteredLeaves.length} leave record(s)`,
    );
  }
}
