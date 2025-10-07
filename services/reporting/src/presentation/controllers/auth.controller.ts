import { Controller, Post, Body, HttpException, HttpStatus ,Get } from '@nestjs/common';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LoginDto } from '../../application/dto/login.dto';

@Controller('')
export class AuthController {
  constructor(private loginUseCase: LoginUseCase) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const { token, role } = await this.loginUseCase.execute(loginDto);
      return { success: true, token, role, message: 'Login successful' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
  @Get('/health')
  health() { return { status: 'ok' }; }
}