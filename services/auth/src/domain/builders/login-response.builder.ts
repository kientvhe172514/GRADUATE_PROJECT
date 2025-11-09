import { LoginResponseDto } from '../../application/dto/login-response.dto';
import { UserInfoDto } from '../../application/dto/user-info.dto';

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
    const userInfo: UserInfoDto = { 
      id, 
      email, 
      full_name: fullName, 
      role 
    };
    this.response.user = userInfo;
    return this;
  }

  build(): LoginResponseDto {
    return { ...this.response };
  }
}