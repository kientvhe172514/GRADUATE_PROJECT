import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { UpdateLeaveTypeDto } from '../dto/leave-type.dto';

@Injectable()
export class UpdateLeaveTypeUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(id: number, dto: UpdateLeaveTypeDto) {
    const existing = await this.leaveTypeRepository.findById(id);
    if (!existing) {
      throw new Error('Leave type not found');
    }

    return this.leaveTypeRepository.update(id, dto);
  }
}
