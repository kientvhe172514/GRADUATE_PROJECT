import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { CreateLeaveTypeDto } from '../dto/leave-type.dto';
import { CreateLeaveTypeResponseDto } from '../dto/leave-type-response.dto';
import { LeaveTypeMapper } from '../mappers/leave-type.mapper';

@Injectable()
export class CreateLeaveTypeUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(dto: CreateLeaveTypeDto): Promise<CreateLeaveTypeResponseDto> {
    // Check if code already exists
    const existing = await this.leaveTypeRepository.findByCode(dto.leave_type_code);
    if (existing) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Leave type code already exists',
        409,
        `Leave type with code '${dto.leave_type_code}' already exists`,
      );
    }

    // Set default status if not provided
    const leaveTypeData = {
      ...dto,
      status: dto.status || 'ACTIVE',
    };

    const createdEntity = await this.leaveTypeRepository.create(leaveTypeData);

    return LeaveTypeMapper.toCreateResponseDto(createdEntity);
  }
}
