import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PRESENCE_VERIFICATION_REPOSITORY,
  PresenceVerificationRepositoryPort,
} from '../../ports/presence-verification.repository.port';
import {
  GPS_ANOMALY_REPOSITORY,
  GpsAnomalyRepositoryPort,
} from '../../ports/gps-anomaly.repository.port';
import { IEventPublisher } from '../../ports/event-publisher.port';
import { PresenceVerificationRoundEntity } from '../../../domain/entities/presence-verification-round.entity';
import { GpsAnomalyEntity } from '../../../domain/entities/gps-anomaly.entity';
import { PresenceVerificationCapturedEvent } from '../../../domain/events/presence-verification-captured.event';
import { GpsAnomalyDetectedEvent } from '../../../domain/events/gps-anomaly-detected.event';
import { CapturePresenceVerificationDto } from '../dto/presence-verification.dto';

interface OfficeLocation {
  latitude: number;
  longitude: number;
  name: string;
}

@Injectable()
export class CapturePresenceVerificationUseCase {
  constructor(
    @Inject('IPresenceVerificationRepository')
    private readonly verificationRepository: PresenceVerificationRepositoryPort,
    @Inject('IGpsAnomalyRepository')
    private readonly anomalyRepository: GpsAnomalyRepositoryPort,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: CapturePresenceVerificationDto,
    shiftData: any,
  ): Promise<PresenceVerificationRoundEntity> {
    // 1. Validate shift status
    if (shiftData.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Shift is not in progress');
    }

    // 2. Check if round already captured
    const existingRound =
      await this.verificationRepository.findByShiftIdAndRoundNumber(
        dto.shift_id,
        dto.round_number,
      );

    if (existingRound) {
      throw new BadRequestException(
        `Round ${dto.round_number} already captured`,
      );
    }

    // 3. Get office location (from department/config)
    const officeLocation = await this.getOfficeLocation(
      shiftData.department_id,
    );

    // 4. Calculate distance from office
    const distanceFromOffice = this.calculateDistance(
      dto.latitude,
      dto.longitude,
      officeLocation.latitude,
      officeLocation.longitude,
    );

    // 5. Calculate distance from check-in location
    const checkInDistance = shiftData.check_in_latitude
      ? this.calculateDistance(
          dto.latitude,
          dto.longitude,
          shiftData.check_in_latitude,
          shiftData.check_in_longitude,
        )
      : null;

    // 6. Validate location
    const validation = this.validateLocation(
      distanceFromOffice,
      dto.location_accuracy,
    );

    // 7. Check for anomalies
    await this.checkForAnomalies({
      dto,
      shiftData,
      distanceFromOffice,
      officeLocation,
    });

    // 8. Create verification round
    const round = new PresenceVerificationRoundEntity({
      shift_id: dto.shift_id,
      employee_id: dto.employee_id,
      round_number: dto.round_number,
      latitude: dto.latitude,
      longitude: dto.longitude,
      location_accuracy: dto.location_accuracy,
      is_valid: validation.isValid,
      distance_from_office_meters: distanceFromOffice,
      distance_from_check_in_meters: checkInDistance,
      validation_status: validation.status,
      validation_reason: validation.reason,
      device_id: dto.device_id,
      battery_level: dto.battery_level,
      captured_at: dto.captured_at,
      created_at: new Date(),
    });

    const savedRound = await this.verificationRepository.create(round);

    // 9. Publish event
    await this.eventPublisher.publish({
      pattern: 'presence.verification.captured',
      data: new PresenceVerificationCapturedEvent(
        savedRound,
        dto.shift_id,
        dto.employee_id,
        dto.round_number,
        validation.isValid,
      ),
    });

    return savedRound;
  }

  private validateLocation(
    distanceFromOffice: number,
    accuracy?: number,
  ): {
    isValid: boolean;
    status: 'VALID' | 'INVALID' | 'OUT_OF_RANGE' | 'SUSPICIOUS';
    reason?: string;
  } {
    const MAX_DISTANCE = 1000; // 1km
    const MAX_ACCURACY = 100; // 100 meters

    // Check distance
    if (distanceFromOffice > MAX_DISTANCE) {
      return {
        isValid: false,
        status: 'OUT_OF_RANGE',
        reason: `Too far from office: ${Math.round(distanceFromOffice)}m (max: ${MAX_DISTANCE}m)`,
      };
    }

    // Check GPS accuracy
    if (accuracy && accuracy > MAX_ACCURACY) {
      return {
        isValid: false,
        status: 'SUSPICIOUS',
        reason: `GPS accuracy too low: ${accuracy}m (max: ${MAX_ACCURACY}m)`,
      };
    }

    return {
      isValid: true,
      status: 'VALID',
    };
  }

  private async checkForAnomalies(params: {
    dto: CapturePresenceVerificationDto;
    shiftData: any;
    distanceFromOffice: number;
    officeLocation: OfficeLocation;
  }): Promise<void> {
    const { dto, shiftData, distanceFromOffice } = params;

    // 1. Check OUT_OF_RANGE
    if (distanceFromOffice > 1000) {
      await this.createAnomaly({
        employee_id: dto.employee_id,
        shift_id: dto.shift_id,
        anomaly_type: 'OUT_OF_RANGE',
        severity: distanceFromOffice > 5000 ? 'HIGH' : 'MEDIUM',
        description: `Employee ${distanceFromOffice}m away from office during shift`,
        evidence_data: {
          location: { lat: dto.latitude, lng: dto.longitude },
          distance: distanceFromOffice,
          accuracy: dto.location_accuracy,
        },
      });
    }

    // 2. Check TELEPORTATION
    const previousRounds =
      await this.verificationRepository.findByShiftId(dto.shift_id);
    if (previousRounds.length > 0) {
      const lastRound = previousRounds[previousRounds.length - 1];
      const speed = this.calculateSpeed(
        lastRound.latitude,
        lastRound.longitude,
        lastRound.captured_at,
        dto.latitude,
        dto.longitude,
        dto.captured_at,
      );

      if (speed > 100) {
        // > 100 km/h
        await this.createAnomaly({
          employee_id: dto.employee_id,
          shift_id: dto.shift_id,
          anomaly_type: 'TELEPORTATION',
          severity: speed > 200 ? 'CRITICAL' : 'HIGH',
          description: `Impossible speed detected: ${Math.round(speed)} km/h`,
          evidence_data: {
            locations: [
              {
                lat: lastRound.latitude,
                lng: lastRound.longitude,
                timestamp: lastRound.captured_at.toISOString(),
              },
              {
                lat: dto.latitude,
                lng: dto.longitude,
                timestamp: dto.captured_at.toISOString(),
              },
            ],
            speed,
          },
        });
      }
    }

    // 3. Check GPS_SPOOFING
    if (dto.location_accuracy === 0 || dto.location_accuracy === undefined) {
      await this.createAnomaly({
        employee_id: dto.employee_id,
        shift_id: dto.shift_id,
        anomaly_type: 'GPS_SPOOFING',
        severity: 'CRITICAL',
        description: 'GPS spoofing suspected: zero accuracy',
        evidence_data: {
          location: { lat: dto.latitude, lng: dto.longitude },
          accuracy: dto.location_accuracy,
          device_id: dto.device_id,
        },
      });
    }
  }

  private async createAnomaly(data: {
    employee_id: number;
    shift_id?: number;
    anomaly_type: string;
    severity: string;
    description: string;
    evidence_data: any;
  }): Promise<void> {
    const anomaly = new GpsAnomalyEntity({
      employee_id: data.employee_id,
      shift_id: data.shift_id,
      anomaly_type: data.anomaly_type as any,
      severity: data.severity as any,
      description: data.description,
      evidence_data: data.evidence_data,
      detected_at: new Date(),
      auto_flagged: true,
      notified: false,
      requires_investigation: data.severity === 'HIGH' || data.severity === 'CRITICAL',
    });

    const savedAnomaly = await this.anomalyRepository.create(anomaly);

    // Publish event if requires investigation
    if (anomaly.requires_investigation) {
      await this.eventPublisher.publish({
        pattern: 'attendance.anomaly.detected',
        data: new GpsAnomalyDetectedEvent(
          savedAnomaly,
          data.employee_id,
          data.anomaly_type,
          data.severity,
          true,
        ),
      });
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private calculateSpeed(
    lat1: number,
    lon1: number,
    time1: Date,
    lat2: number,
    lon2: number,
    time2: Date,
  ): number {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    const timeDiff = (time2.getTime() - time1.getTime()) / 1000 / 3600; // hours
    return distance / 1000 / timeDiff; // km/h
  }

  private async getOfficeLocation(
    departmentId: number,
  ): Promise<OfficeLocation> {
    // TODO: Get from database/config
    // For now, return default Hanoi office
    return {
      latitude: 21.028511,
      longitude: 105.804817,
      name: 'Main Office Hanoi',
    };
  }
}
