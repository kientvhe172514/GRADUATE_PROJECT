import { Controller, Post, Put, Get, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { RefreshTokenRequestDto, RefreshTokenResponseDto, LogoutRequestDto, LogoutResponseDto } from '../../application/dto/auth.dto';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateAccountUseCase } from '../../application/use-cases/create-account.use-case';
import { UpdateAccountUseCase, UpdateAccountDto } from '../../application/use-cases/update-account.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { CreateAccountDto } from '../../application/dto/create-account.dto';
import { GetAccountUseCase } from '../../application/use-cases/get-account.use-case';
import { ChangePasswordUseCase, ChangePasswordDto } from '../../application/use-cases/change-password.use-case';
import { ForgotPasswordUseCase, ForgotPasswordRequestDto } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase, ResetPasswordRequestDto } from '../../application/use-cases/reset-password.use-case';
// JwtAuthGuard & CurrentUser are imported from shared-common

@ApiTags('auth')
@Controller('auth')
export class AccountController {
  constructor(
    private createAccountUseCase: CreateAccountUseCase,
    private loginUseCase: LoginUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private logoutUseCase: LogoutUseCase,
    private updateAccountUseCase: UpdateAccountUseCase,
    private getAccountUseCase: GetAccountUseCase,
    private changePasswordUseCase: ChangePasswordUseCase,
    private forgotPasswordUseCase: ForgotPasswordUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
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
    return await this.logoutUseCase.execute(logoutDto, user.sub, ipAddress, userAgent);
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

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current account profile' })
  async me(@CurrentUser() user: any): Promise<ApiResponseDto<any>> {
    console.log('🔍 [AccountController] JWT payload:', user);
    return this.getAccountUseCase.execute(user.sub);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current account password' })
  @ApiBody({ schema: { properties: { current_password: { type: 'string' }, new_password: { type: 'string' } }, required: ['current_password','new_password'] } })
  async changeMyPassword(
    @Body() body: { current_password: string; new_password: string },
    @CurrentUser() user: any,
    @Req() req: any,
  ): Promise<ApiResponseDto<null>> {
    console.log('Controller: changeMyPassword called');
    console.log('Controller: user object:', user);
    console.log('Controller: request.user:', req.user);
    
    // Validate required fields
    if (!body.current_password || !body.new_password) {
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Missing required fields: current_password, new_password');
    }

    if (!user || !user.sub) {
      console.log('Controller: User validation failed', { user, hasSub: !!user?.sub });
      throw new BusinessException(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
    }

    console.log('Controller: User validated successfully', { userId: user.sub, email: user.email });

    const dto: ChangePasswordDto = {
      account_id: user.sub,
      current_password: body.current_password,
      new_password: body.new_password,
    };
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.changePasswordUseCase.changePassword(dto, ipAddress, userAgent);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate forgot password flow' })
  async forgotPassword(@Body() body: ForgotPasswordRequestDto): Promise<ApiResponseDto<null>> {
    return this.forgotPasswordUseCase.execute(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() body: ResetPasswordRequestDto): Promise<ApiResponseDto<null>> {
    console.log('🔍 AccountController - Received body:', JSON.stringify(body, null, 2));
    console.log('🔍 AccountController - Body fields:', {
      email: body?.email,
      reset_token: body?.reset_token,
      new_password: body?.new_password,
      hasEmail: !!body?.email,
      hasResetToken: !!body?.reset_token,
      hasNewPassword: !!body?.new_password
    });
    return this.resetPasswordUseCase.execute(body);
  }

  @Post('change-temporary-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change temporary password to permanent password' })
  @ApiBody({ 
    schema: { 
      properties: { 
        account_id: { type: 'number' }, 
        temporary_password: { type: 'string' }, 
        new_password: { type: 'string' } 
      }, 
      required: ['account_id', 'temporary_password', 'new_password'] 
    } 
  })
  async changeTemporaryPassword(
    @Body() body: { account_id: number; temporary_password: string; new_password: string },
    @Req() req: any,
  ): Promise<ApiResponseDto<null>> {
    // Validate required fields
    if (!body.account_id || !body.temporary_password || !body.new_password) {
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Missing required fields: account_id, temporary_password, new_password');
    }

    const dto = {
      account_id: Number(body.account_id),
      temporary_password: body.temporary_password,
      new_password: body.new_password,
    };
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.changePasswordUseCase.changeTemporaryPassword(dto, ipAddress, userAgent);
  }
}