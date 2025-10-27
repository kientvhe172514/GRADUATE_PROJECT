import { BusinessException } from '@graduate-project/shared-common';
import { ErrorCodes } from '@graduate-project/shared-common';

export class DepartmentNotFoundException extends BusinessException {
  constructor(id: number) {
    super(
      ErrorCodes.DEPARTMENT_NOT_FOUND,
      `Department with id ${id} not found`
    );
    this.name = 'DepartmentNotFoundException';
  }
}