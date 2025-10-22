import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';

export class DepartmentNotFoundException extends BusinessException {
  constructor(id: number) {
    super(
      ErrorCodes.DEPARTMENT_NOT_FOUND,
      `Department with id ${id} not found`
    );
    this.name = 'DepartmentNotFoundException';
  }
}