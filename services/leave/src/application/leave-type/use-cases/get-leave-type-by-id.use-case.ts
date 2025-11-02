import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { LeaveTypeResponseDto } from '../dto/leave-type-response.dto';
import { LeaveTypeMapper } from '../mappers/leave-type.mapper';

@Injectable()
export class GetLeaveTypeByIdUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(id: number): Promise<LeaveTypeResponseDto> {
    const entity = await this.leaveTypeRepository.findById(id);

    if (!entity) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Leave type not found',
        404,
        `Leave type with id ${id} not found`,
      );
    }

    return LeaveTypeMapper.toResponseDto(entity);
  }
}

