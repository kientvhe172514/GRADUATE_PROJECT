export class AuditLogs {
  id?: number;
  account_id?: number;
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

  constructor(data: Partial<AuditLogs>) {
    Object.assign(this, data);
    this.created_at = this.created_at || new Date();
  }

  static createSuccessLog(
    accountId: number | null,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): AuditLogs {
    return new AuditLogs({
      account_id: accountId!,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      success: true,
      metadata,
    });
  }

  static createFailureLog(
    accountId: number | null,
    action: string,
    errorMessage: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): AuditLogs {
    return new AuditLogs({
      account_id: accountId!,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      success: false,
      error_message: errorMessage,
      metadata,
    });
  }
}