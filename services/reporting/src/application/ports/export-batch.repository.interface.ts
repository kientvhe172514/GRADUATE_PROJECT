import { ExportBatchEntity } from '../../domain/entities/export-batch.entity';

export interface IExportBatchRepository {
  findAll(filters?: any): Promise<ExportBatchEntity[]>;
  findById(id: number): Promise<ExportBatchEntity | null>;
  findByBatchId(batchId: string): Promise<ExportBatchEntity | null>;
  findByRequestedBy(requestedBy: number): Promise<ExportBatchEntity[]>;
  findByStatus(status: string): Promise<ExportBatchEntity[]>;
  create(batch: Partial<ExportBatchEntity>): Promise<ExportBatchEntity>;
  update(id: number, batch: Partial<ExportBatchEntity>): Promise<ExportBatchEntity>;
  updateProgress(id: number, processedRecords: number, progressPercentage: number): Promise<void>;
  updateStatus(id: number, status: string, errorMessage?: string): Promise<void>;
}
