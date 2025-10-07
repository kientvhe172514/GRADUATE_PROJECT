import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginRequestDto } from '../dto/login-request.dto';  // OK: Path '../dto'
import { LoginResponseDto } from '../dto/login-response.dto';  // OK
import { CreateAccountUseCase } from '../../application/use-cases/create-account.use-case';
import { CreateAccountDto } from '../../application/dto/create-account.dto';  // SỬA: Import đúng DTO cho register

@ApiTags('accounts')
@Controller('accounts')
export class AccountController {
  constructor(private createAccountUseCase: CreateAccountUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    // Implement full login (findByEmail, compare hash, generate tokens)
    // Placeholder
    return { access_token: 'jwt.token', refresh_token: 'refresh.token', user: { id: 1, email: 'test', full_name: 'Test', role: 'EMPLOYEE' } };
  }

  @Post('register')  // SỬA: Use CreateAccountDto for register (internal)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new account (internal from employee event)' })
  async register(@Body() dto: CreateAccountDto): Promise<void> {  // SỬA: DTO CreateAccountDto
    await this.createAccountUseCase.execute(dto);
  }
}