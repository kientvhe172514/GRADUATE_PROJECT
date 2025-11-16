import { BusinessException } from '@graduate-project/shared-common';
import { ErrorCodes } from '@graduate-project/shared-common';

export class PositionNotFoundException extends BusinessException {
  constructor(id: number) {
    super(
      ErrorCodes.POSITION_NOT_FOUND,
      `Position with id ${id} not found`
    );
    this.name = 'PositionNotFoundException';
  }
}

