import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { CreateLeaveTypeDto, LeaveTypeResponseDto } from '../dto/leave-type.dto';

@Injectable()
export class CreateLeaveTypeUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(dto: CreateLeaveTypeDto): Promise<LeaveTypeResponseDto> {
    // Check if code already exists
    const existing = await this.leaveTypeRepository.findByCode(dto.leave_type_code);
    if (existing) {
      throw new BusinessException(
        ErrorCodes.LEAVE_TYPE_CODE_ALREADY_EXISTS,
        'Leave type code already exists',
        400,
      );
    }

    const result = await this.leaveTypeRepository.create(dto);
    return result as LeaveTypeResponseDto;
  }
}
