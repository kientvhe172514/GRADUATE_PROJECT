import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViolationSchema } from '../../infrastructure/persistence/typeorm/violation.schema';
import { ViolationRepository } from '../../infrastructure/repositories/violation.repository';
import { ViolationController } from '../../presentation/controllers/violation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ViolationSchema])],
  controllers: [ViolationController],
  providers: [ViolationRepository],
  exports: [ViolationRepository],
})
export class ViolationModule {}
