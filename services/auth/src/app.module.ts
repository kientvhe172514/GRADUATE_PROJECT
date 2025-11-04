import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, Reflector } from '@nestjs/core';
//import { AuthJwtPermissionGuard } from './presentation/guards/auth-jwt-permission.guard';
import { AccountModule } from './application/account.module';
import { RbacModule } from './application/rbac.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
          __dirname + '/infrastructure/persistence/typeorm/*.schema{.ts,.js}',
        ],
        // ⚠️ TEMPORARY: Enable synchronize in production until migrations are set up
        // TODO: Create proper migrations and disable this
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'secretKey'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    AccountModule,
    RbacModule,
  ],
  controllers: [HealthController],
  providers: [
    // Auth Service JWT Permission Guard - Verifies JWT + checks permissions
    // This is different from shared-common HeaderBasedPermissionGuard
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => {
        return new AuthJwtPermissionGuard(reflector);
      },
      inject: [Reflector],
    },
  ],
})
export class AppModule {}