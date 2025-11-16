import {
  Body,
  Controller,
  Post,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Register a push notification token' })
  @ApiResponse({
    status: 201,
    description: 'Push token registered successfully',
    schema: {
      example: {
        success: true,
        message: 'Push token registered successfully',
        data: {
          id: 1,
          employeeId: 123,
          token: 'fcm-token-abc123xyz',
          deviceType: 'ANDROID',
          deviceId: 'device-uuid-12345',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  async registerToken(@Body() dto: RegisterPushTokenDto, @Req() req: any): Promise<ApiResponseDto<any>> {
    const employeeId = req.user.employee_id; // Extract employee_id from JWT token
    const token = await this.registerTokenUseCase.execute(employeeId, dto);

    return ApiResponseDto.success(token, 'Push token registered successfully', 201);
  }

  @Delete('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister a push notification token' })
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
  async unregisterToken(
    @Body() dto: UnregisterPushTokenDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<null>> {
    const employeeId = req.user.employee_id; // Extract employee_id from JWT token
    await this.unregisterTokenUseCase.execute(employeeId, dto);

    return ApiResponseDto.success(null, 'Push token unregistered successfully');
  }
}
