// rbac.module.ts
import { Module, Global } from '@nestjs/common'; // <-- 1. IMPORT 'Global'
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { RoleController } from '../presentation/controllers/role.controller';
import { PermissionController } from '../presentation/controllers/permission.controller';
import { ApiKeyController } from '../presentation/controllers/api-key.controller';
import { JwtStrategy } from '../infrastructure/auth/jwt.strategy';
import { RoleSchema } from '../infrastructure/persistence/typeorm/role.schema';
import { PermissionSchema } from '../infrastructure/persistence/typeorm/permission.schema';
import { RolePermissionSchema } from '../infrastructure/persistence/typeorm/role-permission.schema';
import { AccountPermissionSchema } from '../infrastructure/persistence/typeorm/account-permission.schema';
import { ApiKeySchema } from '../infrastructure/persistence/typeorm/api-key.schema';
import { PostgresRoleRepository } from '../infrastructure/persistence/repositories/postgres-role.repository';
import { PostgresPermissionRepository } from '../infrastructure/persistence/repositories/postgres-permission.repository';
import { PostgresApiKeyRepository } from '../infrastructure/persistence/repositories/postgres-api-key.repository';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY, API_KEY_REPOSITORY } from './tokens';
@Global() // <-- 2. THÊM @Global() VÀO ĐÂY
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      RoleSchema,
      PermissionSchema,
      RolePermissionSchema,
      AccountPermissionSchema,
      ApiKeySchema,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [RoleController, PermissionController, ApiKeyController],
  providers: [
    JwtStrategy,
    {
      provide: ROLE_REPOSITORY,
      useClass: PostgresRoleRepository,
    },
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PostgresPermissionRepository,
    },
    {
      provide: API_KEY_REPOSITORY,
      useClass: PostgresApiKeyRepository,
    },
  ],
  exports: [JwtStrategy, PassportModule, ROLE_REPOSITORY, PERMISSION_REPOSITORY, API_KEY_REPOSITORY],
})
export class RbacModule {}