import { TimesheetEntryEntity } from '../entities/timesheet-entry.entity';

export class TimesheetSyncedEvent {
  constructor(
    public readonly entry: TimesheetEntryEntity,
  ) {}
}
