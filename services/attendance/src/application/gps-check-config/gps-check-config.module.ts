import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsCheckConfigurationSchema } from '../../infrastructure/persistence/typeorm/gps-check-configuration.schema';
import { TypeOrmGpsCheckConfigurationRepository } from '../../infrastructure/repositories/typeorm-gps-check-configuration.repository';
import { GPS_CHECK_CONFIGURATION_REPOSITORY } from '../ports/gps-check-configuration.repository.port';

// Services
import { GpsCheckCalculatorService } from '../services/gps-check-calculator.service';

// Use Cases
import { CreateGpsCheckConfigUseCase } from '../use-cases/gps-check-config/create-gps-check-config.use-case';
import { UpdateGpsCheckConfigUseCase } from '../use-cases/gps-check-config/update-gps-check-config.use-case';
import { DeleteGpsCheckConfigUseCase } from '../use-cases/gps-check-config/delete-gps-check-config.use-case';
import { GetGpsCheckConfigUseCase } from '../use-cases/gps-check-config/get-gps-check-config.use-case';
import { ListGpsCheckConfigsUseCase } from '../use-cases/gps-check-config/list-gps-check-configs.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([GpsCheckConfigurationSchema])],
  providers: [
    {
      provide: GPS_CHECK_CONFIGURATION_REPOSITORY,
      useClass: TypeOrmGpsCheckConfigurationRepository,
    },
    GpsCheckCalculatorService,
    CreateGpsCheckConfigUseCase,
    UpdateGpsCheckConfigUseCase,
    DeleteGpsCheckConfigUseCase,
    GetGpsCheckConfigUseCase,
    ListGpsCheckConfigsUseCase,
  ],
  exports: [
    GPS_CHECK_CONFIGURATION_REPOSITORY,
    GpsCheckCalculatorService,
    CreateGpsCheckConfigUseCase,
    UpdateGpsCheckConfigUseCase,
    DeleteGpsCheckConfigUseCase,
    GetGpsCheckConfigUseCase,
    ListGpsCheckConfigsUseCase,
  ],
})
export class GpsCheckConfigModule {}
