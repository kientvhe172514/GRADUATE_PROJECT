import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { ListLeaveTypesQueryDto, LeaveTypeStatus } from '../dto/leave-type.dto';

@Injectable()
export class GetLeaveTypesUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(filters?: ListLeaveTypesQueryDto) {
    if (filters?.status === LeaveTypeStatus.ACTIVE) {
      // Optimization path
      if (typeof filters.is_paid === 'undefined') {
        return this.leaveTypeRepository.findActive();
      }
      return this.leaveTypeRepository.findFiltered(LeaveTypeStatus.ACTIVE, filters.is_paid);
    }
    if (!filters || (typeof filters.status === 'undefined' && typeof filters.is_paid === 'undefined')) {
      return this.leaveTypeRepository.findAll();
    }
    return this.leaveTypeRepository.findFiltered(filters.status, filters.is_paid);
  }
}
