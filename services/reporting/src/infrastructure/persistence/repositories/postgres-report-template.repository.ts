import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplateEntity } from '../../../domain/entities/report-template.entity';
import { IReportTemplateRepository } from '../../../application/ports/report-template.repository.interface';
import { ReportTemplateSchema } from '../typeorm/report-template.schema';

@Injectable()
export class PostgresReportTemplateRepository implements IReportTemplateRepository {
  constructor(
    @InjectRepository(ReportTemplateSchema)
    private readonly repository: Repository<ReportTemplateEntity>,
  ) {}

  async findAll(): Promise<ReportTemplateEntity[]> {
    return this.repository.find({ order: { created_at: 'DESC' } });
  }

  async findById(id: number): Promise<ReportTemplateEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByType(templateType: string): Promise<ReportTemplateEntity[]> {
    return this.repository.find({ 
      where: { template_type: templateType },
      order: { created_at: 'DESC' }
    });
  }

  async findByCreator(createdBy: number): Promise<ReportTemplateEntity[]> {
    return this.repository.find({ 
      where: { created_by: createdBy },
      order: { created_at: 'DESC' }
    });
  }

  async findPublic(): Promise<ReportTemplateEntity[]> {
    return this.repository.find({ 
      where: { is_public: true },
      order: { created_at: 'DESC' }
    });
  }

  async create(template: Partial<ReportTemplateEntity>): Promise<ReportTemplateEntity> {
    const entity = this.repository.create(template);
    return this.repository.save(entity);
  }

  async update(id: number, template: Partial<ReportTemplateEntity>): Promise<ReportTemplateEntity> {
    await this.repository.update(id, template);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Report template not found after update');
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
