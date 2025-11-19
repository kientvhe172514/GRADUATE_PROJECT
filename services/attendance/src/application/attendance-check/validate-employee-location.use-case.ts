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
      `Validating location for employee ${employeeId}, shift ${shiftId}`,
    );

    // 1. Fetch office coordinates (try Employee Service first, fallback to config)
    const { office_latitude, office_longitude } =
      await this.getOfficeCoordinates(Number(employeeId));

    // 2. Validate GPS using domain logic
    const maxDistance = Number(
      this.configService.get<number>('MAX_GPS_DISTANCE_METERS') || 200,
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
      `GPS validation result for employee ${employeeId}: ${validation.is_valid ? 'VALID' : 'INVALID'} (distance: ${validation.distance_from_office_meters}m)`,
    );

    // 3. Persist presence verification round
    try {
      await this.captureUseCase.execute({
        employeeId: String(employeeId),
        shiftId: String(shiftId),
        roundNumber: 1, // Client webhook = round 1
        imageUrl: '', // No image from GPS webhook
        location: { latitude, longitude },
      });
      this.logger.debug(
        `Persisted presence verification round for employee ${employeeId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to persist presence verification: ${error.message}`,
      );
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

    let eventPublished = false;
    try {
      if (validation.is_valid) {
        this.eventPublisher.publish(
          'attendance.location_verified',
          eventPayload,
        );
        this.logger.log(
          `✅ Published event: attendance.location_verified for employee ${employeeId}`,
        );
      } else {
        this.eventPublisher.publish(
          'attendance.location_out_of_range',
          eventPayload,
        );
        this.logger.log(
          `⚠️ Published event: attendance.location_out_of_range for employee ${employeeId}`,
        );
      }
      eventPublished = true;
    } catch (error) {
      this.logger.error(`Failed to publish event: ${error.message}`);
    }

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
