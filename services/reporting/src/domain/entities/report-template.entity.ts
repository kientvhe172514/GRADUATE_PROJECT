export class ReportTemplateEntity {
  id: number;
  template_name: string;
  template_type: string;
  description?: string;
  
  columns: any; // jsonb
  filters?: any; // jsonb
  sort_by?: any; // jsonb
  
  output_format: string;
  
  is_public: boolean;
  created_by: number;
  
  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<ReportTemplateEntity>) {
    Object.assign(this, data);
  }
}
