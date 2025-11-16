import {
  Body,
  Controller,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { RegisterPushTokenUseCase } from '../../application/use-cases/register-push-token.use-case';
import { UnregisterPushTokenUseCase } from '../../application/use-cases/unregister-push-token.use-case';
import {
  RegisterPushTokenDto,
  UnregisterPushTokenDto,
} from '../../application/dtos/push-token.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('push-tokens')
@ApiBearerAuth('bearer')
@Controller('push-tokens')
export class PushTokenController {
  constructor(
    private readonly registerTokenUseCase: RegisterPushTokenUseCase,
    private readonly unregisterTokenUseCase: UnregisterPushTokenUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register or update FCM push notification token',
    description: `
      Registers a new FCM token or updates an existing one for the authenticated user.
      
      **How it works:**
      1. Employee ID is automatically extracted from JWT token (no need to send)
      2. Backend will auto-sync with Auth Service to link device_session_id
      3. If device already registered, token will be updated
      
      **When to call:**
      - When app receives new FCM token (onTokenRefresh)
      - After successful login (if token not sent during login)
      - When token is refreshed by Firebase
      
      **Authentication:**
      - Requires valid JWT token in Authorization header
      - Employee ID extracted from token payload (req.user.employee_id)
    `
  })
  @ApiBody({
    type: RegisterPushTokenDto,
    description: 'FCM token registration details',
    examples: {
      ios: {
        summary: 'iOS Device',
        value: {
          deviceId: 'iphone_xyz_12345',
          token: 'fcm_abc123xyz...',
          platform: 'IOS',
        },
      },
      android: {
        summary: 'Android Device',
        value: {
          deviceId: 'android_device_uuid',
          token: 'fcm_android_token...',
          platform: 'ANDROID',
        },
      },
      web: {
        summary: 'Web Browser',
        value: {
          deviceId: 'web_session_12345',
          token: 'fcm_web_token...',
          platform: 'WEB',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Push token registered/updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Push token registered successfully',
        data: {
          id: 789,
          employeeId: 456,
          deviceId: 'iphone_xyz_12345',
          deviceSessionId: 123,
          token: 'fcm_abc123xyz...',
          platform: 'IOS',
          isActive: true,
          lastUsedAt: '2025-11-16T10:30:00Z',
          createdAt: '2025-11-16T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
    schema: {
      example: {
        success: false,
        message: 'Validation failed',
        errors: [
          'deviceId should not be empty',
          'token should not be empty',
          'platform must be a valid enum value',
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
        error: 'Invalid token or token expired',
      },
    },
  })
  async registerToken(
    @Body() dto: RegisterPushTokenDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<any>> {
    // ✅ Extract employee_id from JWT token (set by ExtractUserFromHeadersMiddleware)
    // Headers from API Gateway: X-User-Id, X-User-Email, X-Employee-Id, X-User-Roles, X-User-Permissions
    let employeeId = user?.employee_id;

    // ⚠️ FALLBACK: If account doesn't have employee_id yet, use account_id (sub)
    // This happens when account is created but not linked to employee yet
    if (!employeeId && user?.sub) {
      console.warn(
        `⚠️ Account ${user.sub} (${user.email}) has no employee_id. Using account_id as fallback.`,
      );
      employeeId = user.sub; // Fallback to account_id
    }

    if (!employeeId) {
      throw new BadRequestException(
        'Employee ID not found in token. Account may not be linked to an employee. Please contact administrator.',
      );
    }

    // ✅ Execute use case - backend will auto-sync with device_session
    const token = await this.registerTokenUseCase.execute(employeeId, dto);

    return ApiResponseDto.success(token, 'Push token registered successfully', 201);
  }

  @Delete('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Unregister FCM push notification token',
    description: `
      Removes FCM token for the authenticated user's device.
      
      **How it works:**
      1. Employee ID automatically extracted from JWT token
      2. Unregister by deviceId OR token (at least one required)
      3. Token marked as inactive (not deleted, for audit purposes)
      
      **When to call:**
      - User logs out (recommended)
      - User disables push notifications in settings
      - Device is deactivated/uninstalled
      
      **Note:**
      - Logout flow should also call this endpoint
      - Token is marked inactive but kept for audit trail
    `
  })
  @ApiBody({
    type: UnregisterPushTokenDto,
    description: 'Token to unregister (provide deviceId OR token)',
    examples: {
      byDeviceId: {
        summary: 'Unregister by Device ID',
        value: {
          deviceId: 'iphone_xyz_12345',
        },
      },
      byToken: {
        summary: 'Unregister by FCM Token',
        value: {
          token: 'fcm_abc123xyz...',
        },
      },
      both: {
        summary: 'Unregister by Both (Recommended)',
        value: {
          deviceId: 'iphone_xyz_12345',
          token: 'fcm_abc123xyz...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Push token unregistered successfully',
    schema: {
      example: {
        success: true,
        message: 'Push token unregistered successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing deviceId or token',
    schema: {
      example: {
        success: false,
        message: 'At least one of deviceId or token must be provided',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
    schema: {
      example: {
        success: false,
        message: 'Push token not found for this device',
      },
    },
  })
  async unregisterToken(
    @Body() dto: UnregisterPushTokenDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<null>> {
    // ✅ Validate at least one field provided
    if (!dto.deviceId && !dto.token) {
      throw new BadRequestException('At least one of deviceId or token must be provided');
    }

    // ✅ Extract employee_id from JWT token (via headers from API Gateway)
    let employeeId = user?.employee_id;

    // ⚠️ FALLBACK: Use account_id if employee_id not set
    if (!employeeId && user?.sub) {
      console.warn(`⚠️ Account ${user.sub} has no employee_id. Using account_id as fallback.`);
      employeeId = user.sub;
    }

    if (!employeeId) {
      throw new BadRequestException('Employee ID not found in token. Please login again.');
    }

    // ✅ Execute use case
    await this.unregisterTokenUseCase.execute(employeeId, dto);

    return ApiResponseDto.success(null, 'Push token unregistered successfully');
  }
}
