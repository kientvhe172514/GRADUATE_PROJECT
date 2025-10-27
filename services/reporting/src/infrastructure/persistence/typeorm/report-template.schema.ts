import { EntitySchema } from 'typeorm';
import { ReportTemplateEntity } from '../../../domain/entities/report-template.entity';

export const ReportTemplateSchema = new EntitySchema<ReportTemplateEntity>({
  name: 'ReportTemplate',
  tableName: 'report_templates',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    template_name: { type: 'varchar', length: 255 },
    template_type: { type: 'varchar', length: 50 },
    description: { type: 'text', nullable: true },
    columns: { type: 'jsonb' },
    filters: { type: 'jsonb', nullable: true },
    sort_by: { type: 'jsonb', nullable: true },
    output_format: { type: 'varchar', length: 20, default: 'XLSX' },
    is_public: { type: 'boolean', default: false },
    created_by: { type: 'bigint' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
  indices: [
    { columns: ['template_type'] },
    { columns: ['created_by'] },
  ],
});
