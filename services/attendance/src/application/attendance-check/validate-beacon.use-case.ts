import { Injectable, Logger } from '@nestjs/common';
import { BeaconRepository } from '../../infrastructure/repositories/beacon.repository';
import { RedisService } from '../../infrastructure/redis/redis.service';

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

interface BeaconSession {
  employeeId: number;
  beaconId: number;
  expiresAt: string; // ISO string for Redis storage
}

@Injectable()
export class ValidateBeaconUseCase {
  private readonly logger = new Logger(ValidateBeaconUseCase.name);
  private readonly SESSION_TIMEOUT_MINUTES = 10; // Session timeout in minutes
  private readonly SESSION_TIMEOUT_SECONDS = this.SESSION_TIMEOUT_MINUTES * 60; // Convert to seconds for Redis
  private readonly REDIS_PREFIX = 'beacon_session:'; // Redis key prefix

  constructor(
    private readonly beaconRepository: BeaconRepository,
    private readonly redisService: RedisService,
  ) {}

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

    // Store session in Redis with automatic expiration
    const session: BeaconSession = {
      employeeId: command.employee_id,
      beaconId: validationResult.beacon!.id,
      expiresAt: expiresAt.toISOString(),
    };

    const redisKey = this.REDIS_PREFIX + sessionToken;
    await this.redisService.setObject(
      redisKey,
      session,
      this.SESSION_TIMEOUT_SECONDS,
    );

    // Get total active sessions count
    const allSessionKeys = await this.redisService.keys(
      this.REDIS_PREFIX + '*',
    );

    this.logger.log(
      `✅ Session created in Redis: token="${sessionToken}", employeeId=${command.employee_id}, expiresAt=${expiresAt.toISOString()}, totalSessions=${allSessionKeys.length}`,
    );

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

  async validateSession(
    sessionToken: string,
    employeeId: number,
  ): Promise<{
    valid: boolean;
    beaconId?: number;
    error?: string;
  }> {
    this.logger.log(
      `🔍 Validating session: token="${sessionToken}", employeeId=${employeeId}`,
    );

    const redisKey = this.REDIS_PREFIX + sessionToken;
    const session = await this.redisService.getObject<BeaconSession>(redisKey);

    if (!session) {
      // Get all active sessions for debugging
      const allSessionKeys = await this.redisService.keys(
        this.REDIS_PREFIX + '*',
      );
      this.logger.error(
        `❌ Session not found in Redis. Total active sessions: ${allSessionKeys.length}`,
      );
      return { valid: false, error: 'Invalid session token' };
    }

    if (session.employeeId !== employeeId) {
      this.logger.warn(
        `❌ Employee ID mismatch: expected ${session.employeeId}, got ${employeeId}`,
      );
      return { valid: false, error: 'Session token does not match employee' };
    }

    // Check if session expired (Redis should auto-delete, but double-check)
    const expiresAt = new Date(session.expiresAt);
    if (new Date() > expiresAt) {
      await this.redisService.delete(redisKey);
      this.logger.warn(`❌ Session expired at ${session.expiresAt}`);
      return {
        valid: false,
        error: 'Session expired. Please scan beacon again',
      };
    }

    this.logger.log(
      `✅ Session validated successfully for employee ${employeeId}`,
    );
    return { valid: true, beaconId: session.beaconId };
  }

  private generateSessionToken(employeeId: number, beaconId: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `beacon_${employeeId}_${beaconId}_${timestamp}_${random}`;
  }
}
