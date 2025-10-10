export class AuditLogs {
  id?: number;
  account_id?: number | null;
  action: string;
  
  // Context
  ip_address?: string;
  user_agent?: string;
  
  // Result
  success: boolean;
  error_message?: string;
  
  // Additional data
  metadata?: Record<string, any>;
  
  created_at?: Date;
}
