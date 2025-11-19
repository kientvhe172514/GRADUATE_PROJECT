import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { EMPLOYEE_SHIFT_REPOSITORY } from '../../tokens';
import { IEmployeeShiftRepository } from '../../ports/employee-shift.repository.port';
import {
  EmployeeShiftFilterDto,
  EmployeeShiftDto,
} from '../../dtos/employee-shift.dto';
import { JwtPayload } from '@graduate-project/shared-common';
import { ShiftStatus } from '../../../domain/entities/employee-shift.entity';

@Injectable()
export class GetEmployeeShiftsUseCase {
  constructor(
    @Inject(EMPLOYEE_SHIFT_REPOSITORY)
    private readonly shiftRepository: IEmployeeShiftRepository,
  ) {}

  async execute(
    filter: EmployeeShiftFilterDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<{ data: EmployeeShiftDto[]; total: number }>> {
    const from = new Date(filter.from_date);
    const to = new Date(filter.to_date);

    const allShifts = await this.shiftRepository.findByDateRange(from, to);

    // Determine effective employee_id: if not provided, use current user's employee_id
    const effectiveEmployeeId = filter.employee_id ?? currentUser.employee_id;

    const filtered = allShifts.filter((shift) => {
      const props = shift.get_props();
      if (effectiveEmployeeId && props.employee_id !== effectiveEmployeeId) {
        return false;
      }
      if (
        filter.department_id &&
        props.department_id !== filter.department_id
      ) {
        return false;
      }
      if (filter.status && props.status !== filter.status) {
        return false;
      }
      return true;
    });

    const total = filtered.length;
    const start = filter.offset;
    const end = filter.offset + filter.limit;
    const pageItems = filtered.slice(start, end);

    const data = pageItems.map((s) => new EmployeeShiftDto(s));

    return ApiResponseDto.success(
      { data, total },
      'Employee shifts retrieved successfully.',
    );
  }
}
