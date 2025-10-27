import { MonthlySummaryEntity } from '../entities/monthly-summary.entity';

export class MonthlySummaryGeneratedEvent {
  constructor(
    public readonly summary: MonthlySummaryEntity,
  ) {}
}
