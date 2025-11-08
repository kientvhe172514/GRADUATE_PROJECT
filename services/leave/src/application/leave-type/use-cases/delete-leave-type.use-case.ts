import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
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
      throw new BusinessException(
        ErrorCodes.LEAVE_TYPE_NOT_FOUND,
        'Leave type not found',
        404,
      );
    }
    await this.leaveTypeRepository.delete(id);
  }
}


