import { ViolationEntity } from '../entities/violation.entity';

export class ViolationDetectedEvent {
  constructor(
    public readonly violation: ViolationEntity,
  ) {}
}
