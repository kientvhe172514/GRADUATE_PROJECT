export class AttendanceCheckRecordEntity {
  id?: number;
  employeeId: number;
  checkTime: Date;
  checkType: 'CHECK_IN' | 'CHECK_OUT';
  location?: string;
  latitude?: number;
  longitude?: number;
  deviceInfo?: string;
  ipAddress?: string;
  faceVerified?: boolean;
  faceConfidence?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<AttendanceCheckRecordEntity>) {
    Object.assign(this, partial);
  }
}
