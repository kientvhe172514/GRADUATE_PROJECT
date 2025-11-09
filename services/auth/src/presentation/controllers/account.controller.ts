import { Controller, Post, Put, Get, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { RefreshTokenRequestDto, RefreshTokenResponseDto, LogoutRequestDto, LogoutResponseDto } from '../../application/dto/auth.dto';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { Public } from '../decorators/public.decorator';
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
import { ChangeTemporaryPasswordUseCase } from '../../application/use-cases/change-temporary-password.use-case';
import { ChangeTemporaryPasswordDto } from '../dto/change-temporary-password.dto';

@ApiTags('auth')
@Controller('')
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
    private changeTemporaryPasswordUseCase: ChangeTemporaryPasswordUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Temporary password must be changed' })
  async login(@Body() loginDto: LoginRequestDto, @Req() req: any): Promise<ApiResponseDto<LoginResponseDto>> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.loginUseCase.execute(loginDto, ipAddress, userAgent);
  }

  @Put('/change-temporary-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change temporary password (first-time login)',
    description: `
      **Flow for first-time login with temporary password**
      
      Steps:
      1. User logs in with temporary password sent via email
      2. System allows login but returns: { must_change_password: true }
      3. User calls this PROTECTED endpoint with access_token to change password
      4. System validates temporary password and updates to new password
      5. Temporary password is marked as used
      
      **Requirements:**
      - Must be authenticated (use access_token from login)
      - Current password: The temporary password from email
      - New password: Min 8 characters, must contain uppercase, lowercase, number
      - Cannot reuse temporary password
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        data: { message: 'Mật khẩu đã được thay đổi thành công' },
        timestamp: '2024-01-15T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or password mismatch' })
  @ApiResponse({ status: 401, description: 'Invalid temporary password' })
  @ApiResponse({ status: 404, description: 'No active temporary password found' })
  async changeTemporaryPassword(
    @CurrentUser() user: any,
    @Body() dto: ChangeTemporaryPasswordDto,
  ): Promise<ApiResponseDto<{ message: string }>> {
    return await this.changeTemporaryPasswordUseCase.execute(user.sub, dto);
  }

  @Public()
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

  @Public()
  @Post('register')  // Internal endpoint for manual account creation (Dev/Admin use)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: '🔧 Register new account (Dev/Admin internal use)',
    description: `
      **Internal endpoint for manual account creation**
      
      Features:
      - ✅ Create account with custom password (or temp password "1")
      - ✅ Assign custom role (SUPER_ADMIN, HR_ADMIN, MANAGER, etc.)
      - ✅ Optional employee linking (employee_id, employee_code)
      - ✅ No notification email sent if custom password provided
      
      **Use Cases:**
      - Create SUPER_ADMIN account
      - Create test accounts for development
      - Manual account creation by HR/Admin
      
      **⚠️ Security Note:** This endpoint should be protected in production!
    `
  })
  @ApiBody({
    type: CreateAccountDto,
    examples: {
      superAdmin: {
        summary: 'Create SUPER_ADMIN account',
        value: {
          email: 'superadmin@zentry.com',
          full_name: 'Super Administrator',
          password: 'SecurePassword123!',
          suggested_role: 'SUPER_ADMIN'
        }
      },
      hrAdmin: {
        summary: 'Create HR_ADMIN account',
        value: {
          email: 'hr@zentry.com',
          full_name: 'HR Manager',
          password: 'HRPassword123!',
          suggested_role: 'HR_ADMIN',
          department_name: 'Human Resources'
        }
      },
      employeeWithLink: {
        summary: 'Create linked employee account',
        value: {
          email: 'employee@zentry.com',
          full_name: 'Nguyễn Văn A',
          employee_id: 1,
          employee_code: 'EMP001',
          department_id: 1,
          department_name: 'Engineering',
          position_id: 1,
          position_name: 'Senior Developer',
          suggested_role: 'EMPLOYEE'
        }
      }
    }
  })
  async register(@Body() dto: CreateAccountDto): Promise<ApiResponseDto<{ id: number; email: string; temp_password: string }>> {
    return this.createAccountUseCase.execute(dto);
  }

  @Public()
  @Post('update/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update account' })
  async update(@Body() dto: UpdateAccountDto, @Req() req: any): Promise<ApiResponseDto<any>> {
    const id = Number(req.params.id);
    return this.updateAccountUseCase.execute(id, dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current account profile' })
  async me(@CurrentUser() user: any): Promise<ApiResponseDto<any>> {
    console.log('🔍 [AccountController] JWT payload:', user);
    return this.getAccountUseCase.execute(user.sub);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
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

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate forgot password flow' })
  async forgotPassword(@Body() body: ForgotPasswordRequestDto): Promise<ApiResponseDto<null>> {
    return this.forgotPasswordUseCase.execute(body);
  }

  @Public()
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

}