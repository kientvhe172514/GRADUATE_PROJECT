import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';

@Injectable()
export class DeleteLeaveTypeUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const exists = await this.leaveTypeRepository.findById(id);
    if (!exists) {
      throw new NotFoundException('Leave type not found');
    }
    await this.leaveTypeRepository.delete(id);
  }
}


