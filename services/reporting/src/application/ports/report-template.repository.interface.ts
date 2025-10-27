import { ReportTemplateEntity } from '../../domain/entities/report-template.entity';

export interface IReportTemplateRepository {
  findAll(): Promise<ReportTemplateEntity[]>;
  findById(id: number): Promise<ReportTemplateEntity | null>;
  findByType(templateType: string): Promise<ReportTemplateEntity[]>;
  findByCreator(createdBy: number): Promise<ReportTemplateEntity[]>;
  findPublic(): Promise<ReportTemplateEntity[]>;
  create(template: Partial<ReportTemplateEntity>): Promise<ReportTemplateEntity>;
  update(id: number, template: Partial<ReportTemplateEntity>): Promise<ReportTemplateEntity>;
  delete(id: number): Promise<void>;
}
