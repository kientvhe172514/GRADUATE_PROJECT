import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';

@Injectable()
export class GetLeaveTypesUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(activeOnly: boolean = false) {
    if (activeOnly) {
      return this.leaveTypeRepository.findActive();
    }
    return this.leaveTypeRepository.findAll();
  }
}
