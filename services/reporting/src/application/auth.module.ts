import { Module } from '@nestjs/common';
import { LoginUseCase } from './use-cases/login.use-case';
import { UserRepository } from '../infrastructure/persistence/repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../infrastructure/persistence/entities/user.entity';
import { AuthController } from '../presentation/controllers/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      // hoặc explicit config:
      // host: 'postgres-srv.infrastructure.svc.cluster.local',
      // port: 5432,
      // username: 'postgres',
      // password: 'postgres123', 
      // database: 'authdb',
      entities: [UserEntity],
      synchronize: true,
      ssl: false,
    }),
    TypeOrmModule.forFeature([UserEntity]), // Đảm bảo repository được tạo
  ],
  providers: [
    {
      provide: 'UserRepositoryPort', // Token cho interface
      useClass: UserRepository, // Sử dụng UserRepository làm implementation
    },
    LoginUseCase,
  ],
  controllers: [AuthController],
})
export class AuthModule {}