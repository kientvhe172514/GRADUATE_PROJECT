import { Injectable, Logger } from '@nestjs/common';

export interface ValidateGpsCommand {
  latitude: number;
  longitude: number;
  location_accuracy?: number;
  office_latitude: number;
  office_longitude: number;
  max_distance_meters: number;
}

export interface ValidateGpsResult {
  is_valid: boolean;
  distance_from_office_meters: number;
  location_accuracy?: number;
  message: string;
}

@Injectable()
export class ValidateGpsUseCase {
  private readonly logger = new Logger(ValidateGpsUseCase.name);
  private readonly EARTH_RADIUS_KM = 6371;
  private readonly MAX_ACCEPTABLE_ACCURACY_METERS = 50;

  execute(command: ValidateGpsCommand): ValidateGpsResult {
    // ✅ VALIDATE: Check if GPS coordinates are valid numbers
    if (
      !command.latitude ||
      !command.longitude ||
      isNaN(command.latitude) ||
      isNaN(command.longitude)
    ) {
      this.logger.error(
        `❌ Invalid GPS coordinates: lat=${command.latitude}, lng=${command.longitude}`,
      );
      return {
        is_valid: false,
        distance_from_office_meters: 0,
        location_accuracy: command.location_accuracy,
        message: 'Invalid GPS coordinates. Please enable location permission and try again.',
      };
    }

    // Check GPS accuracy
    if (
      command.location_accuracy &&
      command.location_accuracy > this.MAX_ACCEPTABLE_ACCURACY_METERS
    ) {
      this.logger.warn(
        `GPS accuracy ${command.location_accuracy}m exceeds threshold ${this.MAX_ACCEPTABLE_ACCURACY_METERS}m`,
      );
      return {
        is_valid: false,
        distance_from_office_meters: 0,
        location_accuracy: command.location_accuracy,
        message: `GPS accuracy too low: ${command.location_accuracy}m. Please try again in open area.`,
      };
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      command.latitude,
      command.longitude,
      command.office_latitude,
      command.office_longitude,
    );

    // ✅ VALIDATE: Check if distance calculation resulted in NaN
    if (isNaN(distance)) {
      this.logger.error(
        `❌ Distance calculation failed (NaN): lat1=${command.latitude}, lng1=${command.longitude}, lat2=${command.office_latitude}, lng2=${command.office_longitude}`,
      );
      return {
        is_valid: false,
        distance_from_office_meters: 0,
        location_accuracy: command.location_accuracy,
        message: 'GPS validation failed. Invalid coordinates detected.',
      };
    }

    const isValid = distance <= command.max_distance_meters;

    this.logger.log(
      `GPS validation: distance=${distance.toFixed(2)}m, max_allowed=${command.max_distance_meters}m, valid=${isValid}`,
    );

    return {
      is_valid: isValid,
      distance_from_office_meters: Math.round(distance * 100) / 100,
      location_accuracy: command.location_accuracy,
      message: isValid
        ? `GPS validated successfully. Distance: ${Math.round(distance)}m from office.`
        : `Location too far from office: ${Math.round(distance)}m (max allowed: ${command.max_distance_meters}m)`,
    };
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = this.EARTH_RADIUS_KM * c;
    return distanceKm * 1000; // Convert to meters
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
