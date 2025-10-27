import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from './shared/shared.module';
import { LeaveTypeModule } from './application/leave-type/leave-type.module';
import { HolidayModule } from './application/holiday/holiday.module';
import { LeaveRecordModule } from './application/leave-record/leave-record.module';
import { LeaveBalanceModule } from './application/leave-balance/leave-balance.module';
import { EmployeeEventListener } from './presentation/event-listeners/employee-event.listener';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/infrastructure/persistence/typeorm/**/*.schema{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    SharedModule,
    LeaveTypeModule,
    HolidayModule,
    LeaveRecordModule,
    LeaveBalanceModule,
  ],
  controllers: [EmployeeEventListener],
})
export class AppModule {}
