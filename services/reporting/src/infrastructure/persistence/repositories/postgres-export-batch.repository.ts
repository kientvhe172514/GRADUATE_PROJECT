import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportBatchEntity } from '../../../domain/entities/export-batch.entity';
import { IExportBatchRepository } from '../../../application/ports/export-batch.repository.interface';
import { ExportBatchSchema } from '../typeorm/export-batch.schema';

@Injectable()
export class PostgresExportBatchRepository implements IExportBatchRepository {
  constructor(
    @InjectRepository(ExportBatchSchema)
    private readonly repository: Repository<ExportBatchEntity>,
  ) {}

  async findAll(filters?: any): Promise<ExportBatchEntity[]> {
    return this.repository.find({ 
      where: filters,
      order: { requested_at: 'DESC' }
    });
  }

  async findById(id: number): Promise<ExportBatchEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByBatchId(batchId: string): Promise<ExportBatchEntity | null> {
    return this.repository.findOne({ where: { batch_id: batchId } });
  }

  async findByRequestedBy(requestedBy: number): Promise<ExportBatchEntity[]> {
    return this.repository.find({ 
      where: { requested_by: requestedBy },
      order: { requested_at: 'DESC' }
    });
  }

  async findByStatus(status: string): Promise<ExportBatchEntity[]> {
    return this.repository.find({ 
      where: { status },
      order: { requested_at: 'DESC' }
    });
  }

  async create(batch: Partial<ExportBatchEntity>): Promise<ExportBatchEntity> {
    const entity = this.repository.create(batch);
    return this.repository.save(entity);
  }

  async update(id: number, batch: Partial<ExportBatchEntity>): Promise<ExportBatchEntity> {
    await this.repository.update(id, batch);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Export batch not found after update');
    }
    return updated;
  }

  async updateProgress(
    id: number, 
    processedRecords: number, 
    progressPercentage: number
  ): Promise<void> {
    await this.repository.update(id, {
      processed_records: processedRecords,
      progress_percentage: progressPercentage,
    });
  }

  async updateStatus(id: number, status: string, errorMessage?: string): Promise<void> {
    const updates: any = { status };
    if (status === 'PROCESSING') {
      updates.started_at = new Date();
    }
    if (status === 'COMPLETED' || status === 'FAILED') {
      updates.completed_at = new Date();
    }
    if (errorMessage) {
      updates.error_message = errorMessage;
    }
    await this.repository.update(id, updates);
  }
}
