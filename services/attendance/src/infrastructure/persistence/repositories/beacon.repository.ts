import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeaconSchema } from '../typeorm/beacon.schema';

export interface BeaconValidationResult {
  isValid: boolean;
  beacon?: BeaconSchema;
  distanceMeters?: number;
  error?: string;
}

@Injectable()
export class BeaconRepository {
  constructor(
    @InjectRepository(BeaconSchema)
    private readonly repository: Repository<BeaconSchema>,
  ) {}

  async findByIdentity(
    uuid: string,
    major: number,
    minor: number,
  ): Promise<BeaconSchema | null> {
    return this.repository.findOne({
      where: {
        beacon_uuid: uuid,
        beacon_major: major,
        beacon_minor: minor,
        status: 'ACTIVE',
      },
    });
  }

  async validateBeacon(
    uuid: string,
    major: number,
    minor: number,
    rssi: number,
  ): Promise<BeaconValidationResult> {
    const beacon = await this.findByIdentity(uuid, major, minor);

    if (!beacon) {
      return {
        isValid: false,
        error: 'Beacon not found or inactive',
      };
    }

    // Check RSSI threshold
    if (rssi < beacon.rssi_threshold) {
      return {
        isValid: false,
        beacon,
        error: `Signal too weak. RSSI ${rssi} < threshold ${beacon.rssi_threshold}`,
      };
    }

    // Calculate distance from RSSI (simplified formula)
    // Distance (meters) = 10 ^ ((Measured Power - RSSI) / (10 * N))
    // N = 2 for free space, Measured Power ≈ -59 dBm at 1m
    const measuredPower = -59;
    const pathLossExponent = 2;
    const distanceMeters = Math.pow(
      10,
      (measuredPower - rssi) / (10 * pathLossExponent),
    );

    // Check if within range
    if (distanceMeters > beacon.signal_range_meters) {
      return {
        isValid: false,
        beacon,
        distanceMeters,
        error: `Too far from beacon. Distance ${distanceMeters.toFixed(1)}m > range ${beacon.signal_range_meters}m`,
      };
    }

    return {
      isValid: true,
      beacon,
      distanceMeters,
    };
  }

  async findByDepartment(departmentId: number): Promise<BeaconSchema[]> {
    return this.repository.find({
      where: {
        department_id: departmentId,
        status: 'ACTIVE',
      },
      order: {
        location_name: 'ASC',
      },
    });
  }
}
