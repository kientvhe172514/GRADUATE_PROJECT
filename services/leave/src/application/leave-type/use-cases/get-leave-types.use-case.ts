import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { ListLeaveTypesQueryDto, LeaveTypeStatus, LeaveTypeResponseDto } from '../dto/leave-type.dto';

@Injectable()
export class GetLeaveTypesUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(filters?: ListLeaveTypesQueryDto): Promise<LeaveTypeResponseDto[]> {
    let results;
    
    // Check if status filter is provided and valid
    const hasStatusFilter = filters?.status !== undefined && filters?.status !== null && (filters?.status as string) !== '';
    const hasIsPaidFilter = filters?.is_paid !== undefined && filters?.is_paid !== null;
    
    if (hasStatusFilter && filters.status === LeaveTypeStatus.ACTIVE) {
      // Optimization path for active status
      if (!hasIsPaidFilter) {
        results = await this.leaveTypeRepository.findActive();
      } else {
        results = await this.leaveTypeRepository.findFiltered(LeaveTypeStatus.ACTIVE, filters.is_paid);
      }
    } else if (!hasStatusFilter && !hasIsPaidFilter) {
      // No filters - get all
      results = await this.leaveTypeRepository.findAll();
    } else {
      // Has filters - use filtered query
      const status = hasStatusFilter ? filters.status : undefined;
      const isPaid = hasIsPaidFilter ? filters.is_paid : undefined;
      results = await this.leaveTypeRepository.findFiltered(status, isPaid);
    }
    
    return results as LeaveTypeResponseDto[];
  }
}
