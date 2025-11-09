import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { LeaveTypeResponseDto } from '../dto/leave-type.dto';

@Injectable()
export class GetLeaveTypeByIdUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(id: number): Promise<LeaveTypeResponseDto> {
    const item = await this.leaveTypeRepository.findById(id);
    if (!item) {
      throw new BusinessException(
        ErrorCodes.LEAVE_TYPE_NOT_FOUND,
        'Leave type not found',
        404,
      );
    }
    return item as LeaveTypeResponseDto;
  }
}


