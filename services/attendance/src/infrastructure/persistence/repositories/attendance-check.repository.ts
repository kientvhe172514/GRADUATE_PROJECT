import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceCheckRecordSchema } from '../typeorm/attendance-check-record.schema';

export interface CreateCheckRecordDto {
  employee_id: number;
  employee_code: string;
  department_id: number;
  check_type: string;
  beacon_id?: number;
  beacon_validated: boolean;
  beacon_rssi?: number;
  beacon_distance_meters?: number;
  // GPS validation fields
  gps_validated?: boolean;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  distance_from_office_meters?: number;
  // Device info
  device_id?: string;
  ip_address?: string;
}

export interface UpdateFaceVerificationDto {
  face_verified: boolean;
  face_confidence?: number;
  photo_url?: string;
  verified_at?: Date;
  is_valid?: boolean;
  notes?: string;
}

@Injectable()
export class AttendanceCheckRepository {
  constructor(
    @InjectRepository(AttendanceCheckRecordSchema)
    private readonly repository: Repository<AttendanceCheckRecordSchema>,
  ) {}

  async create(dto: CreateCheckRecordDto): Promise<AttendanceCheckRecordSchema> {
    const record = this.repository.create({
      ...dto,
      check_timestamp: new Date(),
      gps_validated: dto.gps_validated ?? false,
      face_verified: false,
      is_valid: false,
      is_manually_corrected: false,
      created_at: new Date(),
    });

    return this.repository.save(record);
  }

  async updateFaceVerification(
    recordId: number,
    dto: UpdateFaceVerificationDto,
  ): Promise<AttendanceCheckRecordSchema | null> {
    const record = await this.repository.findOne({
      where: { id: recordId },
    });

    if (!record) {
      return null;
    }

    record.face_verified = dto.face_verified;
    record.face_confidence = dto.face_confidence;
    record.photo_url = dto.photo_url;
    
    if (dto.verified_at !== undefined) {
      record.verified_at = dto.verified_at;
    }
    
    if (dto.notes !== undefined) {
      record.notes = dto.notes;
    }

    // Update overall validation status
    if (dto.is_valid !== undefined) {
      record.is_valid = dto.is_valid;
    } else {
      record.is_valid =
        record.beacon_validated && record.face_verified && record.gps_validated;
    }

    return this.repository.save(record);
  }

  async findById(id: number): Promise<AttendanceCheckRecordSchema | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmployeeAndDateRange(
    employeeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceCheckRecordSchema[]> {
    return this.repository.find({
      where: {
        employee_id: employeeId,
        check_timestamp: Between(startDate, endDate),
      },
      order: {
        check_timestamp: 'DESC',
      },
    });
  }

  async findTodayCheckIn(
    employeeId: number,
  ): Promise<AttendanceCheckRecordSchema | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.repository.findOne({
      where: {
        employee_id: employeeId,
        check_type: 'CHECK_IN',
        check_timestamp: Between(today, tomorrow),
      },
      order: {
        check_timestamp: 'DESC',
      },
    });
  }

  async countValidChecksToday(employeeId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.repository.count({
      where: {
        employee_id: employeeId,
        is_valid: true,
        check_timestamp: Between(today, tomorrow),
      },
    });
  }
}
