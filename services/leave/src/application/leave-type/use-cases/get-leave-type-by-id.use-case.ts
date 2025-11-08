import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';

@Injectable()
export class GetLeaveTypeByIdUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(id: number) {
    const item = await this.leaveTypeRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Leave type not found');
    }
    return item;
  }
}


