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
    
    if (filters?.status === LeaveTypeStatus.ACTIVE) {
      // Optimization path
      if (typeof filters.is_paid === 'undefined') {
        results = await this.leaveTypeRepository.findActive();
      } else {
        results = await this.leaveTypeRepository.findFiltered(LeaveTypeStatus.ACTIVE, filters.is_paid);
      }
    } else if (!filters || (typeof filters.status === 'undefined' && typeof filters.is_paid === 'undefined')) {
      results = await this.leaveTypeRepository.findAll();
    } else {
      results = await this.leaveTypeRepository.findFiltered(filters.status, filters.is_paid);
    }
    
    return results as LeaveTypeResponseDto[];
  }
}
