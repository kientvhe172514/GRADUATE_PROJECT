export class ViolationEntity {
  id?: number;
  employeeId: number;
  violationType: 'LATE' | 'EARLY_LEAVE' | 'MISSING_CHECKIN' | 'MISSING_CHECKOUT' | 'ABSENT' | 'OTHER';
  violationDate: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  referenceId?: number; // ID của attendance record hoặc shift
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  approvedBy?: number;
  approvedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<ViolationEntity>) {
    Object.assign(this, partial);
  }
}
