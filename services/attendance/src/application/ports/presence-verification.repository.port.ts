import { PresenceVerificationRoundEntity } from '../../domain/entities/presence-verification-round.entity';

export const PRESENCE_VERIFICATION_REPOSITORY =
  'PRESENCE_VERIFICATION_REPOSITORY';

export interface PresenceVerificationRepositoryPort {
  create(
    round: PresenceVerificationRoundEntity,
  ): Promise<PresenceVerificationRoundEntity>;

  findById(id: number): Promise<PresenceVerificationRoundEntity | null>;

  findByShiftId(shiftId: number): Promise<PresenceVerificationRoundEntity[]>;

  findByShiftIdAndRoundNumber(
    shiftId: number,
    roundNumber: number,
  ): Promise<PresenceVerificationRoundEntity | null>;

  findByEmployeeId(employeeId: number): Promise<PresenceVerificationRoundEntity[]>;

  countByShiftId(shiftId: number): Promise<number>;

  update(
    id: number,
    data: Partial<PresenceVerificationRoundEntity>,
  ): Promise<PresenceVerificationRoundEntity>;

  delete(id: number): Promise<void>;

  findInvalidRounds(shiftId: number): Promise<PresenceVerificationRoundEntity[]>;
}
