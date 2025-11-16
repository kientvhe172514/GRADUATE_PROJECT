import { PresenceVerificationRoundEntity } from '../entities/presence-verification-round.entity';

export class PresenceVerificationCapturedEvent {
  constructor(
    public readonly round: PresenceVerificationRoundEntity,
    public readonly shiftId: number,
    public readonly employeeId: number,
    public readonly roundNumber: number,
    public readonly isValid: boolean,
  ) {}
}
