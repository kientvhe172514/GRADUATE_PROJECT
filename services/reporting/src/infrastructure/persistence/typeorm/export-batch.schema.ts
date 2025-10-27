import { EntitySchema } from 'typeorm';
import { ExportBatchEntity } from '../../../domain/entities/export-batch.entity';

export const ExportBatchSchema = new EntitySchema<ExportBatchEntity>({
  name: 'ExportBatch',
  tableName: 'export_batches',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    batch_id: { type: 'varchar', length: 50, unique: true },
    requested_by: { type: 'bigint' },
    export_type: { type: 'varchar', length: 50 },
    start_date: { type: 'date', nullable: true },
    end_date: { type: 'date', nullable: true },
    filters: { type: 'jsonb', nullable: true },
    output_format: { type: 'varchar', length: 20 },
    file_url: { type: 'varchar', length: 500, nullable: true },
    file_size: { type: 'int', nullable: true },
    status: { type: 'varchar', length: 20, default: 'PENDING' },
    progress_percentage: { type: 'int', default: 0 },
    total_records: { type: 'int', default: 0 },
    processed_records: { type: 'int', default: 0 },
    error_message: { type: 'text', nullable: true },
    requested_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
    started_at: { type: 'timestamp', nullable: true },
    completed_at: { type: 'timestamp', nullable: true },
    expires_at: { type: 'timestamp', nullable: true },
  },
  indices: [
    { columns: ['batch_id'] },
    { columns: ['requested_by'] },
    { columns: ['status'] },
    { columns: ['requested_at'] },
  ],
});
