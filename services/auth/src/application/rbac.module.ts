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
import { AccountSchema } from '../infrastructure/persistence/typeorm/account.schema';
import { PostgresRoleRepository } from '../infrastructure/persistence/repositories/postgres-role.repository';
import { PostgresPermissionRepository } from '../infrastructure/persistence/repositories/postgres-permission.repository';
import { PostgresApiKeyRepository } from '../infrastructure/persistence/repositories/postgres-api-key.repository';
import { PostgresAccountRepository } from '../infrastructure/persistence/repositories/postgres-account.repository';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY, API_KEY_REPOSITORY, ACCOUNT_REPOSITORY } from './tokens';

// Import Use Cases
import { CreateRoleUseCase } from './use-cases/rbac/create-role.use-case';
import { UpdateRoleUseCase } from './use-cases/rbac/update-role.use-case';
import { DeleteRoleUseCase } from './use-cases/rbac/delete-role.use-case';
import { GetRoleDetailUseCase } from './use-cases/rbac/get-role-detail.use-case';
import { ListRolesUseCase } from './use-cases/rbac/list-roles.use-case';
import { AssignPermissionsToRoleUseCase } from './use-cases/rbac/assign-permissions-to-role.use-case';
import { CreatePermissionUseCase } from './use-cases/rbac/create-permission.use-case';
import { UpdatePermissionUseCase } from './use-cases/rbac/update-permission.use-case';
import { DeletePermissionUseCase } from './use-cases/rbac/delete-permission.use-case';
import { ListPermissionsUseCase } from './use-cases/rbac/list-permissions.use-case';

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
      AccountSchema,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [RoleController, PermissionController, ApiKeyController],
  providers: [
    JwtStrategy,
    // Repositories
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
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PostgresAccountRepository,
    },
    // Role Use Cases
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    GetRoleDetailUseCase,
    ListRolesUseCase,
    AssignPermissionsToRoleUseCase,
    // Permission Use Cases
    CreatePermissionUseCase,
    UpdatePermissionUseCase,
    DeletePermissionUseCase,
    ListPermissionsUseCase,
  ],
  exports: [
    JwtStrategy, 
    PassportModule, 
    ROLE_REPOSITORY, 
    PERMISSION_REPOSITORY, 
    API_KEY_REPOSITORY,
    ACCOUNT_REPOSITORY,
  ],
})
export class RbacModule {}