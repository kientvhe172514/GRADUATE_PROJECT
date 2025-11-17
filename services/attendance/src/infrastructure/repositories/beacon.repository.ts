import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BeaconSchema } from '../persistence/typeorm/beacon.schema';

@Injectable()
export class BeaconRepository extends Repository<BeaconSchema> {
  constructor(private dataSource: DataSource) {
    super(BeaconSchema, dataSource.createEntityManager());
  }

  async findAllBeacons(
    departmentId?: number,
    status?: string,
    limit = 50,
    offset = 0,
  ): Promise<BeaconSchema[]> {
    const query = this.createQueryBuilder('beacon');

    if (departmentId) {
      query.andWhere('beacon.department_id = :departmentId', { departmentId });
    }

    if (status) {
      query.andWhere('beacon.status = :status', { status });
    }

    return query
      .orderBy('beacon.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async findByUUID(
    uuid: string,
    major: number,
    minor: number,
  ): Promise<BeaconSchema | null> {
    return this.findOne({
      where: {
        beacon_uuid: uuid,
        beacon_major: major,
        beacon_minor: minor,
      },
    });
  }

  async findByDepartment(departmentId: number): Promise<BeaconSchema[]> {
    return this.find({
      where: { department_id: departmentId, status: 'ACTIVE' },
      order: { location_name: 'ASC' },
    });
  }

  async createBeacon(
    data: Partial<BeaconSchema>,
    createdBy: number,
  ): Promise<BeaconSchema> {
    const beacon = this.create({
      ...data,
      created_by: createdBy,
      updated_by: createdBy,
    } as any);
    const saved = await this.save(beacon);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateBeacon(
    id: number,
    data: Partial<BeaconSchema>,
    updatedBy: number,
  ): Promise<boolean> {
    const result = await this.update(id, {
      ...data,
      updated_by: updatedBy,
      updated_at: new Date(),
    } as any);
    return (result.affected ?? 0) > 0;
  }

  async updateBeaconStatus(id: number, status: string): Promise<boolean> {
    const result = await this.update(id, {
      status,
      updated_at: new Date(),
    });
    return (result.affected ?? 0) > 0;
  }

  async updateLastHeartbeat(id: number): Promise<boolean> {
    const result = await this.update(id, {
      last_heartbeat_at: new Date(),
      status: 'ACTIVE',
    });
    return (result.affected ?? 0) > 0;
  }

  async deleteBeacon(id: number): Promise<boolean> {
    const result = await this.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async countByDepartment(departmentId: number): Promise<number> {
    return this.count({ where: { department_id: departmentId } });
  }

  async findInactiveBeacons(hoursThreshold = 24): Promise<BeaconSchema[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursThreshold);

    return this.createQueryBuilder('beacon')
      .where('beacon.status = :status', { status: 'ACTIVE' })
      .andWhere('beacon.last_heartbeat_at < :cutoffDate', { cutoffDate })
      .getMany();
  }

  async validateBeacon(
    uuid: string,
    major: number,
    minor: number,
    rssi: number,
  ): Promise<{
    isValid: boolean;
    beacon?: BeaconSchema;
    distanceMeters?: number;
    error?: string;
  }> {
    const beacon = await this.findOne({
      where: {
        beacon_uuid: uuid,
        beacon_major: major,
        beacon_minor: minor,
        status: 'ACTIVE',
      },
    });

    if (!beacon) {
      return {
        isValid: false,
        error: 'Beacon not found or inactive',
      };
    }

    // Calculate distance based on RSSI (simplified)
    const txPower = -59; // Typical value for iBeacon
    const distanceMeters = Math.pow(10, (txPower - rssi) / 20);

    // Validate distance (within 100 meters)
    if (distanceMeters > 100) {
      return {
        isValid: false,
        beacon,
        distanceMeters,
        error: 'Beacon too far away',
      };
    }

    return {
      isValid: true,
      beacon,
      distanceMeters,
    };
  }
}
