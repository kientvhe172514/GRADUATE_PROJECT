import {
  Body,
  Controller,
  Post,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterPushTokenUseCase } from '../../application/use-cases/register-push-token.use-case';
import { UnregisterPushTokenUseCase } from '../../application/use-cases/unregister-push-token.use-case';
import {
  RegisterPushTokenDto,
  UnregisterPushTokenDto,
} from '../../application/dtos/push-token.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('push-tokens')
@Controller('push-tokens')
export class PushTokenController {
  constructor(
    private readonly registerTokenUseCase: RegisterPushTokenUseCase,
    private readonly unregisterTokenUseCase: UnregisterPushTokenUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a push notification token' })
  @ApiResponse({ status: 201, description: 'Push token registered successfully' })
  async registerToken(@Body() dto: RegisterPushTokenDto, @Req() req: any): Promise<ApiResponseDto<any>> {
    const userId = req.user.id;
    const token = await this.registerTokenUseCase.execute(userId, dto);

    return ApiResponseDto.success(token, 'Push token registered successfully', 201);
  }

  @Delete('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister a push notification token' })
  @ApiResponse({ status: 200, description: 'Push token unregistered successfully' })
  async unregisterToken(
    @Body() dto: UnregisterPushTokenDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<null>> {
    const userId = req.user.id;
    await this.unregisterTokenUseCase.execute(userId, dto);

    return ApiResponseDto.success(null, 'Push token unregistered successfully');
  }
}
