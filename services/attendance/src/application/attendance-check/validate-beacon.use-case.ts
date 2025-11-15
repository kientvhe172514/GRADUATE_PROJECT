import { Injectable, BadRequestException } from '@nestjs/common';
import { BeaconRepository } from '../../infrastructure/persistence/repositories/beacon.repository';

export interface ValidateBeaconCommand {
  employee_id: number;
  employee_code: string;
  beacon_uuid: string;
  beacon_major: number;
  beacon_minor: number;
  rssi: number;
}

export interface ValidateBeaconResult {
  success: boolean;
  beacon_validated: boolean;
  beacon_id?: number;
  location_name?: string;
  distance_meters?: number;
  session_token: string;
  expires_at: Date;
  message: string;
}

@Injectable()
export class ValidateBeaconUseCase {
  private readonly SESSION_TIMEOUT_MINUTES = 5;
  private readonly beaconSessions = new Map<
    string,
    { employeeId: number; beaconId: number; expiresAt: Date }
  >();

  constructor(private readonly beaconRepository: BeaconRepository) {
    // Clean expired sessions every minute
    setInterval(() => this.cleanExpiredSessions(), 60000);
  }

  async execute(command: ValidateBeaconCommand): Promise<ValidateBeaconResult> {
    // Validate beacon
    const validationResult = await this.beaconRepository.validateBeacon(
      command.beacon_uuid,
      command.beacon_major,
      command.beacon_minor,
      command.rssi,
    );

    if (!validationResult.isValid) {
      return {
        success: false,
        beacon_validated: false,
        session_token: '',
        expires_at: new Date(),
        message: validationResult.error || 'Beacon validation failed',
      };
    }

    // Create session token
    const sessionToken = this.generateSessionToken(
      command.employee_id,
      validationResult.beacon!.id,
    );

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.SESSION_TIMEOUT_MINUTES);

    // Store session
    this.beaconSessions.set(sessionToken, {
      employeeId: command.employee_id,
      beaconId: validationResult.beacon!.id,
      expiresAt,
    });

    return {
      success: true,
      beacon_validated: true,
      beacon_id: validationResult.beacon!.id,
      location_name: validationResult.beacon!.location_name,
      distance_meters: validationResult.distanceMeters,
      session_token: sessionToken,
      expires_at: expiresAt,
      message: `Beacon validated successfully at ${validationResult.beacon!.location_name}. You have ${this.SESSION_TIMEOUT_MINUTES} minutes to complete face verification.`,
    };
  }

  validateSession(sessionToken: string, employeeId: number): {
    valid: boolean;
    beaconId?: number;
    error?: string;
  } {
    const session = this.beaconSessions.get(sessionToken);

    if (!session) {
      return { valid: false, error: 'Invalid session token' };
    }

    if (session.employeeId !== employeeId) {
      return { valid: false, error: 'Session token does not match employee' };
    }

    if (new Date() > session.expiresAt) {
      this.beaconSessions.delete(sessionToken);
      return { valid: false, error: 'Session expired. Please scan beacon again' };
    }

    return { valid: true, beaconId: session.beaconId };
  }

  private generateSessionToken(employeeId: number, beaconId: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `beacon_${employeeId}_${beaconId}_${timestamp}_${random}`;
  }

  private cleanExpiredSessions(): void {
    const now = new Date();
    for (const [token, session] of this.beaconSessions.entries()) {
      if (now > session.expiresAt) {
        this.beaconSessions.delete(token);
      }
    }
  }
}
