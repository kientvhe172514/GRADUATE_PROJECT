export enum ContractType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  DRAFT = 'DRAFT',
}

export class Contract {
  id?: number;
  employee_id: number;
  contract_number: string;
  contract_type: ContractType;
  
  start_date: Date;
  end_date?: Date;
  
  // Compensation
  base_salary: number;
  allowances?: Record<string, any>;
  currency: string = 'VND';
  
  status: ContractStatus = ContractStatus.ACTIVE;
  signed_date?: Date;
  document_url?: string;
  
  created_at?: Date;
  updated_at?: Date;

  constructor(data: Partial<Contract>) {
    Object.assign(this, data);
    this.created_at = this.created_at || new Date();
    this.updated_at = this.updated_at || new Date();
  }

  isActive(): boolean {
    return this.status === ContractStatus.ACTIVE;
  }

  isExpired(): boolean {
    if (!this.end_date) return false;
    return new Date() > this.end_date;
  }

  getDurationInDays(): number {
    if (!this.end_date) return 0;
    return Math.ceil((this.end_date.getTime() - this.start_date.getTime()) / (1000 * 60 * 60 * 24));
  }

  updateTimestamp(): void {
    this.updated_at = new Date();
  }
}
