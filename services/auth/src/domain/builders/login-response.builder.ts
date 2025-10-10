import { LoginResponseDto } from '../../presentation/dto/login-response.dto';

export class LoginResponseBuilder {
  private response: LoginResponseDto;

  constructor() {
    this.response = {
      access_token: '',
      refresh_token: '',
      user: {
        id: 0,
        email: '',
        full_name: '',
        role: '',
      }
    };
  }

  withTokens(accessToken: string, refreshToken: string): LoginResponseBuilder {
    this.response.access_token = accessToken;
    this.response.refresh_token = refreshToken;
    return this;
  }

  withUser(id: number, email: string, fullName: string, role: string): LoginResponseBuilder {
    this.response.user = { id, email, full_name: fullName, role };
    return this;
  }

  build(): LoginResponseDto {
    return { ...this.response };
  }
}