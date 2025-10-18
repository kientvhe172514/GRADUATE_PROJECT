export enum DigitalContractStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  SIGNED = 'SIGNED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export class DigitalContract {
  id?: number;
  employee_id: number;
  contract_id?: number;
  
  contract_number: string;
  contract_type: string;
  
  contract_content: string;
  contract_pdf_url?: string;
  
  status: DigitalContractStatus = DigitalContractStatus.DRAFT;
  
  sent_to_employee_at?: Date;
  viewed_at?: Date;
  
  // Signatures
  employee_signed_at?: Date;
  employee_signature_data?: string;
  employee_ip_address?: string;
  
  company_signed_at?: Date;
  company_signed_by?: number;
  company_signature_data?: string;
  
  expires_at?: Date;
  
  created_at?: Date;
  updated_at?: Date;

  constructor(data: Partial<DigitalContract>) {
    Object.assign(this, data);
    this.created_at = this.created_at || new Date();
    this.updated_at = this.updated_at || new Date();
  }

  isExpired(): boolean {
    if (!this.expires_at) return false;
    return new Date() > this.expires_at;
  }

  isSigned(): boolean {
    return this.status === DigitalContractStatus.SIGNED;
  }

  canBeSigned(): boolean {
    return this.status === DigitalContractStatus.VIEWED && !this.isExpired();
  }

  markAsSent(): void {
    this.status = DigitalContractStatus.SENT;
    this.sent_to_employee_at = new Date();
    this.updateTimestamp();
  }

  markAsViewed(): void {
    this.status = DigitalContractStatus.VIEWED;
    this.viewed_at = new Date();
    this.updateTimestamp();
  }

  signByEmployee(signatureData: string, ipAddress?: string): void {
    this.status = DigitalContractStatus.SIGNED;
    this.employee_signed_at = new Date();
    this.employee_signature_data = signatureData;
    this.employee_ip_address = ipAddress;
    this.updateTimestamp();
  }

  signByCompany(signedBy: number, signatureData: string): void {
    this.company_signed_at = new Date();
    this.company_signed_by = signedBy;
    this.company_signature_data = signatureData;
    this.updateTimestamp();
  }

  private updateTimestamp(): void {
    this.updated_at = new Date();
  }
}
