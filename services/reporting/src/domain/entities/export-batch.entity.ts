export class ExportBatchEntity {
  id: number;
  batch_id: string;
  
  requested_by: number;
  export_type: string;
  
  start_date?: Date;
  end_date?: Date;
  filters?: any; // jsonb
  
  output_format: string;
  file_url?: string;
  file_size?: number;
  
  status: string; // PENDING, PROCESSING, COMPLETED, FAILED
  
  progress_percentage: number;
  total_records: number;
  processed_records: number;
  
  error_message?: string;
  
  requested_at: Date;
  started_at?: Date;
  completed_at?: Date;
  expires_at?: Date;

  constructor(data: Partial<ExportBatchEntity>) {
    Object.assign(this, data);
  }
}
