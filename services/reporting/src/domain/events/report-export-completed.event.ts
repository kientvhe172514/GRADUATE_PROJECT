import { ExportBatchEntity } from '../entities/export-batch.entity';

export class ReportExportCompletedEvent {
  constructor(
    public readonly exportBatch: ExportBatchEntity,
  ) {}
}
