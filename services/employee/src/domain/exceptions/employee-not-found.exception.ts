import { BusinessException } from '@graduate-project/shared-common';
import { ErrorCodes } from '@graduate-project/shared-common';

export class EmployeeNotFoundException extends BusinessException {
  constructor(id: number) {
    super(
      ErrorCodes.EMPLOYEE_NOT_FOUND,
      `Employee with id ${id} not found`
    );
    this.name = 'EmployeeNotFoundException';
  }
}