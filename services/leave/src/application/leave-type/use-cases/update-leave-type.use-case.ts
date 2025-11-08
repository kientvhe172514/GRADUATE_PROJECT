import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { UpdateLeaveTypeDto, LeaveTypeResponseDto } from '../dto/leave-type.dto';

@Injectable()
export class UpdateLeaveTypeUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(id: number, dto: UpdateLeaveTypeDto): Promise<LeaveTypeResponseDto> {
    const existing = await this.leaveTypeRepository.findById(id);
    if (!existing) {
      throw new BusinessException(
        ErrorCodes.LEAVE_TYPE_NOT_FOUND,
        'Leave type not found',
        404,
      );
    }

    const result = await this.leaveTypeRepository.update(id, dto);
    return result as LeaveTypeResponseDto;
  }
}
