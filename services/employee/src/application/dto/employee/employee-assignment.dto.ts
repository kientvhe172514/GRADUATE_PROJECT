import { ApiProperty } from '@nestjs/swagger';
import { EmployeeDetailDto } from './employee-detail.dto';
import { DepartmentDetailDto } from '../department/department-detail.dto';
import { PositionResponseDto } from '../position-response.dto';
import { EmployeeSummaryDto } from './list-employee.dto';

export class EmployeeAssignmentDto {
  @ApiProperty({ description: 'Employee details' })
  employee: EmployeeDetailDto;

  @ApiProperty({ required: false, description: 'Department details if assigned' })
  department?: DepartmentDetailDto | null;

  @ApiProperty({ required: false, description: 'Position details if assigned' })
  position?: PositionResponseDto | null;

  @ApiProperty({ required: false, description: 'Manager details if assigned' })
  manager?: EmployeeSummaryDto | null;
}

