export class ListAuditLogsRequestDto {
  page?: number = 1;
  limit?: number = 10;
  account_id?: number;
  action?: string;
  success?: boolean;
  start_date?: string;
  end_date?: string;
  sort_by?: string = 'created_at';
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class ListAuditLogsResponseDto {
  logs: AuditLogSummaryDto[];
  pagination: PaginationDto;
}

export class AuditLogSummaryDto {
  id: number;
  account_id: number | null;
  email: string | null;
  action: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  metadata: any;
  created_at: Date;
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
