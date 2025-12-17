import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { ValidateGpsUseCase, ValidateGpsResult } from './validate-gps.use-case';
import { CapturePresenceVerificationUseCase } from '../presence-verification/use-cases/capture-presence-verification.use-case';
import { EventPublisherPort } from '../ports/event.publisher.port';

export interface ValidateEmployeeLocationCommand {
  employeeId: string;
  shiftId: string;
  latitude: number;
  longitude: number;
  location_accuracy?: number;
}

export interface ValidateEmployeeLocationResult extends ValidateGpsResult {
  eventPublished: boolean;
}

/**
 * Use Case: Validate Employee Location
 *
 * Clean Architecture Application Layer Use Case
 *
 * Responsibilities:
 * 1. Fetch office coordinates (from Employee Service or Config)
 * 2. Validate GPS location using domain logic (ValidateGpsUseCase)
 * 3. Persist presence verification round
 * 4. Publish domain events via EventPublisherPort
 *
 * Dependencies:
 * - ValidateGpsUseCase (domain logic)
 * - CapturePresenceVerificationUseCase (persistence)
 * - EventPublisherPort (domain event publishing)
 * - ConfigService (infrastructure config)
 * - ClientProxy (RPC to Employee Service)
 */
@Injectable()
export class ValidateEmployeeLocationUseCase {
  private readonly logger = new Logger(ValidateEmployeeLocationUseCase.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly validateGpsUseCase: ValidateGpsUseCase,
    private readonly captureUseCase: CapturePresenceVerificationUseCase,
    @Inject('EMPLOYEE_SERVICE') private readonly employeeClient: ClientProxy,
    @Inject('IEventPublisher')
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(
    command: ValidateEmployeeLocationCommand,
  ): Promise<ValidateEmployeeLocationResult> {
    const { employeeId, shiftId, latitude, longitude, location_accuracy } =
      command;

    this.logger.log(
      `🔍 [VALIDATE-LOCATION] Starting validation for employee ${employeeId}, shift ${shiftId}`,
    );
    this.logger.debug(
      `🔍 [VALIDATE-LOCATION] Input: lat=${latitude}, lng=${longitude}, accuracy=${location_accuracy}m`,
    );

    // 1. Fetch office coordinates (try Employee Service first, fallback to config)
    this.logger.debug(
      `🔍 [VALIDATE-LOCATION] Fetching office coordinates for employee ${employeeId}...`,
    );
    const { office_latitude, office_longitude } =
      await this.getOfficeCoordinates(Number(employeeId));

    this.logger.debug(
      `🔍 [VALIDATE-LOCATION] Office coords: lat=${office_latitude}, lng=${office_longitude}`,
    );

    // 2. Validate GPS using domain logic
    const maxDistance = Number(
      this.configService.get<number>('MAX_GPS_DISTANCE_METERS') || 200,
    );

    this.logger.debug(
      `🔍 [VALIDATE-LOCATION] Max allowed distance: ${maxDistance}m`,
    );

    const validation = this.validateGpsUseCase.execute({
      latitude,
      longitude,
      location_accuracy,
      office_latitude,
      office_longitude,
      max_distance_meters: maxDistance,
    });

    this.logger.log(
      `🔍 [VALIDATE-LOCATION] GPS validation result: ${validation.is_valid ? '✅ VALID' : '❌ INVALID'} (distance: ${Math.round(validation.distance_from_office_meters)}m)`,
    );

    // 3. Persist presence verification round (captureUseCase will auto-calculate round number)
    this.logger.debug(
      `🔍 [VALIDATE-LOCATION] Persisting verification round to DB...`,
    );
    try {
      await this.captureUseCase.execute({
        employeeId: String(employeeId),
        shiftId: String(shiftId),
        roundNumber: 0, // ✅ FIX: Use 0 to signal auto-calculation in CapturePresenceVerificationUseCase
        imageUrl: '', // No image from GPS webhook
        location: { latitude, longitude },
        validation: {
          is_valid: validation.is_valid,
          distance_from_office_meters: validation.distance_from_office_meters,
          location_accuracy: location_accuracy,
          validation_status: validation.is_valid ? 'VALID' : 'OUT_OF_RANGE',
          validation_reason: validation.message,
        },
      });
      this.logger.log(
        `🔍 [VALIDATE-LOCATION] ✅ Persisted presence verification round for employee ${employeeId}`,
      );
    } catch (error) {
      this.logger.error(
        `🔍 [VALIDATE-LOCATION] ❌ Failed to persist presence verification: ${error.message}`,
      );
      this.logger.error(error.stack);
    }

    // 4. Publish domain event
    const eventPayload = {
      employeeId: Number(employeeId),
      shiftId: Number(shiftId),
      latitude,
      longitude,
      validation,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(
      `🔍 [VALIDATE-LOCATION] Publishing domain event...`,
    );

    let eventPublished = false;
    try {
      if (validation.is_valid) {
        this.eventPublisher.publish(
          'attendance.location_verified',
          eventPayload,
        );
        this.logger.log(
          `🔍 [VALIDATE-LOCATION] ✅ Published event: attendance.location_verified for employee ${employeeId}`,
        );
      } else {
        this.eventPublisher.publish(
          'attendance.location_out_of_range',
          eventPayload,
        );
        this.logger.log(
          `🔍 [VALIDATE-LOCATION] ⚠️ Published event: attendance.location_out_of_range for employee ${employeeId}`,
        );
        this.logger.debug(
          `🔍 [VALIDATE-LOCATION] Event payload: ${JSON.stringify(eventPayload)}`,
        );
      }
      eventPublished = true;
    } catch (error) {
      this.logger.error(
        `🔍 [VALIDATE-LOCATION] ❌ Failed to publish event: ${error.message}`,
      );
      this.logger.error(error.stack);
    }

    this.logger.log(
      `🔍 [VALIDATE-LOCATION] ✅ Completed validation for employee ${employeeId}`,
    );

    return {
      ...validation,
      eventPublished,
    };
  }

  /**
   * Get office coordinates from Employee Service (via RPC) or fallback to config
   */
  private async getOfficeCoordinates(employeeId: number): Promise<{
    office_latitude: number;
    office_longitude: number;
  }> {
    // Default from config
    let office_latitude = Number(
      this.configService.get<number>('OFFICE_LATITUDE') || 10.762622,
    );
    let office_longitude = Number(
      this.configService.get<number>('OFFICE_LONGITUDE') || 106.660172,
    );

    try {
      const resp = await firstValueFrom(
        this.employeeClient
          .send('get_employee_detail', { employee_id: employeeId })
          .pipe(
            timeout(2500),
            catchError((error) => {
              this.logger.debug(
                `Employee Service RPC failed: ${error.message}`,
              );
              return of(null);
            }),
          ),
      );

      if (
        resp &&
        resp.department &&
        resp.department.office_latitude &&
        resp.department.office_longitude
      ) {
        office_latitude = Number(resp.department.office_latitude);
        office_longitude = Number(resp.department.office_longitude);
        this.logger.log(
          `Using office coords from Employee Service for employee ${employeeId}: [${office_latitude}, ${office_longitude}]`,
        );
      } else {
        this.logger.debug(
          `No office coords from Employee Service, using config defaults`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Could not fetch employee detail from Employee Service: ${error.message}. Using config defaults.`,
      );
    }

    return { office_latitude, office_longitude };
  }
}
