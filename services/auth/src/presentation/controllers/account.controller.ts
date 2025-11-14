import { Controller, Post, Put, Get, Body, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../../application/dto/login-response.dto';
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
import { CreateAccountResponseDto } from '../../application/dto/create-account-response.dto';
import { GetAccountUseCase } from '../../application/use-cases/get-account.use-case';
import { GetAccountResponseDto } from '../../application/dto/get-account-response.dto';
import { ChangePasswordUseCase, ChangePasswordDto } from '../../application/use-cases/change-password.use-case';
import { ChangePasswordRequestDto } from '../../application/dto/change-password-request.dto';
import { ForgotPasswordUseCase, ForgotPasswordRequestDto } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase, ResetPasswordRequestDto } from '../../application/use-cases/reset-password.use-case';
import { ChangeTemporaryPasswordUseCase } from '../../application/use-cases/change-temporary-password.use-case';
import { ChangeTemporaryPasswordDto } from '../dto/change-temporary-password.dto';
import { ChangeTemporaryPasswordResponseDto } from '../../application/dto/change-temporary-password-response.dto';

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
  @ApiOperation({ 
    summary: 'User login',
    description: `
      **Login Flow with Cookies:**
      
      1. User submits email + password
      2. System validates credentials
      3. System generates access_token + refresh_token
      4. System sets HttpOnly cookies for security:
         - \`access_token\` cookie (15 minutes expiry)
         - \`refresh_token\` cookie (7 days expiry)
      5. System returns tokens in response body (for mobile apps)
      
      **Cookie Configuration:**
      - HttpOnly: ✅ Prevents XSS attacks
      - Secure: ✅ HTTPS only (in production)
      - SameSite: Lax (CSRF protection)
      - Domain: Configured for cross-subdomain sharing
      
      **Web vs Mobile:**
      - Web: Use cookies automatically
      - Mobile App: Use tokens from response body
    `
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Temporary password must be changed' })
  async login(
    @Body() loginDto: LoginRequestDto, 
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Execute login use case
    const loginResult = await this.loginUseCase.execute(loginDto, ipAddress, userAgent);

    // Extract tokens from response
    const { access_token, refresh_token } = loginResult.data!;

    // Set HttpOnly cookies for Web browsers
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || 'localhost';

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: cookieDomain,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    console.log('🍪 [Login] Cookies set successfully');

    return loginResult;
  }

  @Put('me/change-temporary-password')
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
  ): Promise<ApiResponseDto<ChangeTemporaryPasswordResponseDto>> {
    return await this.changeTemporaryPasswordUseCase.execute(user.accountId, dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: `
      **Refresh Token Flow with Cookies:**
      
      1. Client sends refresh_token (from cookie or request body)
      2. System validates refresh_token
      3. System generates new access_token + refresh_token
      4. System updates HttpOnly cookies
      5. System returns new tokens in response body
      
      **Cookie Support:**
      - Web: Automatically reads from HttpOnly cookie
      - Mobile App: Send refresh_token in request body
    `
  })
  @ApiResponse({ status: 200, type: RefreshTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshDto: RefreshTokenRequestDto, 
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponseDto<RefreshTokenResponseDto>> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Try to get refresh_token from cookie if not provided in body (Web browser flow)
    let refreshTokenToUse = refreshDto.refresh_token;
    if (!refreshTokenToUse && req.cookies?.refresh_token) {
      refreshTokenToUse = req.cookies.refresh_token;
      console.log('🍪 [Refresh] Using refresh_token from cookie');
    }

    // Override the DTO with cookie value if available
    const refreshRequest: RefreshTokenRequestDto = {
      refresh_token: refreshTokenToUse,
    };

    const refreshResult = await this.refreshTokenUseCase.execute(refreshRequest, ipAddress, userAgent);

    // Extract new tokens from response
    const { access_token, refresh_token } = refreshResult.data!;

    // Update cookies with new tokens
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || 'localhost';

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: cookieDomain,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    console.log('🍪 [Refresh] Cookies updated successfully');

    return refreshResult;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'User logout',
    description: `
      **Logout Flow with Cookies:**
      
      1. System invalidates refresh_token in database
      2. System clears HttpOnly cookies
      3. Client should discard access_token
      
      **Cookie Clearing:**
      - Removes access_token cookie
      - Removes refresh_token cookie
      - Works for both Web and Mobile
    `
  })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  async logout(
    @Body() logoutDto: LogoutRequestDto,
    @CurrentUser() user: any,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponseDto<LogoutResponseDto>> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Execute logout use case
    const logoutResult = await this.logoutUseCase.execute(logoutDto, user.sub, ipAddress, userAgent);

    // Clear HttpOnly cookies
    const cookieDomain = process.env.COOKIE_DOMAIN || 'localhost';
    
    res.clearCookie('access_token', {
      httpOnly: true,
      domain: cookieDomain,
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      domain: cookieDomain,
      path: '/',
    });

    console.log('🍪 [Logout] Cookies cleared successfully');

    return logoutResult;
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
      - ✅ Assign role from roles table (ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE)
      - ✅ Optional employee linking (employee_id, employee_code)
      - ✅ No notification email sent if custom password provided
      
      **Valid Roles:**
      - ADMIN: System administrator
      - HR_MANAGER: Human resources manager
      - DEPARTMENT_MANAGER: Department manager
      - EMPLOYEE: Regular employee (default)
      
      **Use Cases:**
      - Create ADMIN account
      - Create HR_MANAGER account
      - Create test accounts for development
      - Manual account creation by HR/Admin
      
      **⚠️ Security Note:** This endpoint should be protected in production!
    `
  })
  @ApiBody({
    type: CreateAccountDto,
    examples: {
      admin: {
        summary: 'Create ADMIN account',
        value: {
          email: 'admin@zentry.com',
          full_name: 'Administrator',
          password: 'SecurePassword123!',
          suggested_role: 'ADMIN'
        }
      },
      hrManager: {
        summary: 'Create HR_MANAGER account',
        value: {
          email: 'hr@zentry.com',
          full_name: 'HR Manager',
          password: 'HRPassword123!',
          suggested_role: 'HR_MANAGER',
          department_name: 'Human Resources'
        }
      },
      departmentManager: {
        summary: 'Create DEPARTMENT_MANAGER account',
        value: {
          email: 'manager@zentry.com',
          full_name: 'Department Manager',
          password: 'ManagerPassword123!',
          suggested_role: 'DEPARTMENT_MANAGER',
          department_id: 1,
          department_name: 'Engineering'
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
  @ApiResponse({ status: 201, type: CreateAccountResponseDto })
  async register(@Body() dto: CreateAccountDto): Promise<ApiResponseDto<CreateAccountResponseDto>> {
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
  @ApiResponse({ status: 200, type: GetAccountResponseDto })
  async me(@CurrentUser() user: any): Promise<ApiResponseDto<GetAccountResponseDto>> {
    console.log('🔍 [AccountController] JWT payload:', user);
    return this.getAccountUseCase.execute(user.sub);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current account password' })
  @ApiBody({ type: ChangePasswordRequestDto })
  async changeMyPassword(
    @Body() body: ChangePasswordRequestDto,
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