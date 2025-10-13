import {
  Body,
  Controller,
  Post,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterPushTokenUseCase } from '../../application/use-cases/register-push-token.use-case';
import { UnregisterPushTokenUseCase } from '../../application/use-cases/unregister-push-token.use-case';
import {
  RegisterPushTokenDto,
  UnregisterPushTokenDto,
} from '../../application/dtos/push-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('push-tokens')
@ApiBearerAuth()
@Controller('push-tokens')
@UseGuards(JwtAuthGuard)
export class PushTokenController {
  constructor(
    private readonly registerTokenUseCase: RegisterPushTokenUseCase,
    private readonly unregisterTokenUseCase: UnregisterPushTokenUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a push notification token' })
  @ApiResponse({ status: 201, description: 'Push token registered successfully' })
  async registerToken(@Body() dto: RegisterPushTokenDto, @Req() req: any) {
    const userId = req.user.id;
    const token = await this.registerTokenUseCase.execute(userId, dto);

    return {
      success: true,
      message: 'Push token registered successfully',
      data: token,
    };
  }

  @Delete('unregister')
  @ApiOperation({ summary: 'Unregister a push notification token' })
  @ApiResponse({ status: 200, description: 'Push token unregistered successfully' })
  async unregisterToken(
    @Body() dto: UnregisterPushTokenDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    await this.unregisterTokenUseCase.execute(userId, dto);

    return {
      success: true,
      message: 'Push token unregistered successfully',
    };
  }
}
