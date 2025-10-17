import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { RefreshTokenRequestDto, RefreshTokenResponseDto, LogoutRequestDto, LogoutResponseDto } from '../../application/dto/auth.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { CreateAccountUseCase } from '../../application/use-cases/create-account.use-case';
import { UpdateAccountUseCase, UpdateAccountDto } from '../../application/use-cases/update-account.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { CreateAccountDto } from '../../application/dto/create-account.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AccountController {
  constructor(
    private createAccountUseCase: CreateAccountUseCase,
    private loginUseCase: LoginUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private logoutUseCase: LogoutUseCase,
    private updateAccountUseCase: UpdateAccountUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginRequestDto, @Req() req: any): Promise<ApiResponseDto<LoginResponseDto>> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.loginUseCase.execute(loginDto, ipAddress, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: RefreshTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshDto: RefreshTokenRequestDto, @Req() req: any): Promise<ApiResponseDto<RefreshTokenResponseDto>> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.refreshTokenUseCase.execute(refreshDto, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  async logout(
    @Body() logoutDto: LogoutRequestDto,
    @CurrentUser() user: any,
    @Req() req: any
  ): Promise<ApiResponseDto<LogoutResponseDto>> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.logoutUseCase.execute(logoutDto, user.id, ipAddress, userAgent);
  }

  @Post('register')  // Internal endpoint for employee service
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new account (internal from employee event)' })
  async register(@Body() dto: CreateAccountDto): Promise<ApiResponseDto<{ id: number; email: string; temp_password: string }>> {
    return this.createAccountUseCase.execute(dto);
  }

  @Post('update/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update account' })
  async update(@Body() dto: UpdateAccountDto, @Req() req: any): Promise<ApiResponseDto<any>> {
    const id = Number(req.params.id);
    return this.updateAccountUseCase.execute(id, dto);
  }
}