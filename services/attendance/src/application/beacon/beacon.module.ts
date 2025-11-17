import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeaconSchema } from '../../infrastructure/persistence/typeorm/beacon.schema';
import { BeaconRepository } from '../../infrastructure/repositories/beacon.repository';
import { BeaconController } from '../../presentation/controllers/beacon.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BeaconSchema])],
  controllers: [BeaconController],
  providers: [BeaconRepository],
  exports: [BeaconRepository],
})
export class BeaconModule {}
