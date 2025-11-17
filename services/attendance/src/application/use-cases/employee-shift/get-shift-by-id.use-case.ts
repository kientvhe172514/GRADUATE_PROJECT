import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { EMPLOYEE_SHIFT_REPOSITORY } from '../../tokens';
import { IEmployeeShiftRepository } from '../../ports/employee-shift.repository.port';
import { EmployeeShiftDto } from '../../dtos/employee-shift.dto';

@Injectable()
export class GetShiftByIdUseCase {
  constructor(
    @Inject(EMPLOYEE_SHIFT_REPOSITORY)
    private readonly shiftRepository: IEmployeeShiftRepository,
  ) {}

  async execute(id: number): Promise<ApiResponseDto<EmployeeShiftDto>> {
    const shift = await this.shiftRepository.findById(id);
    if (!shift) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Shift not found.',
        404,
      );
    }

    return ApiResponseDto.success(
      new EmployeeShiftDto(shift),
      'Shift retrieved successfully.',
    );
  }
}


