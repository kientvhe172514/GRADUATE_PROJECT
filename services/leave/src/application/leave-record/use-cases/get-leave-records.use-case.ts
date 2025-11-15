import { Inject, Injectable } from '@nestjs/common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { LEAVE_RECORD_REPOSITORY } from '../../tokens';
import { GetLeaveRecordsQueryDto, LeaveRecordResponseDto } from '../dto/leave-record.dto';

@Injectable()
export class GetLeaveRecordsUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
  ) {}

  async execute(filters: GetLeaveRecordsQueryDto): Promise<LeaveRecordResponseDto[]> {
    // If date range is provided, use date range query
    if (filters.start_date && filters.end_date) {
      const startDate = new Date(filters.start_date);
      const endDate = new Date(filters.end_date);
      let results = await this.leaveRecordRepository.findByDateRange(startDate, endDate);

      // Apply additional filters
      if (filters.employee_id !== undefined && filters.employee_id !== null) {
        results = results.filter(r => r.employee_id === filters.employee_id);
      }
      if (filters.status !== undefined && filters.status !== null && (filters.status as string) !== '') {
        results = results.filter(r => r.status === filters.status);
      }
      if (filters.leave_type_id !== undefined && filters.leave_type_id !== null) {
        results = results.filter(r => r.leave_type_id === filters.leave_type_id);
      }
      if (filters.department_id !== undefined && filters.department_id !== null) {
        results = results.filter(r => r.department_id === filters.department_id);
      }

      return results as LeaveRecordResponseDto[];
    }

    // Otherwise use findAll with filters
    const queryFilters: any = {};
    if (filters.employee_id !== undefined && filters.employee_id !== null) {
      queryFilters.employee_id = filters.employee_id;
    }
    if (filters.status !== undefined && filters.status !== null && (filters.status as string) !== '') {
      queryFilters.status = filters.status;
    }
    if (filters.leave_type_id !== undefined && filters.leave_type_id !== null) {
      queryFilters.leave_type_id = filters.leave_type_id;
    }
    if (filters.department_id !== undefined && filters.department_id !== null) {
      queryFilters.department_id = filters.department_id;
    }

    const results = await this.leaveRecordRepository.findAll(Object.keys(queryFilters).length > 0 ? queryFilters : undefined);
    return results as LeaveRecordResponseDto[];
  }
}

