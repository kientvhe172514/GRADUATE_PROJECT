import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@graduate-project/shared-common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    
    // --- DEBUG BƯỚC 1: KIỂM TRA SECRET KEY ---
    const secret = configService.get<string>('JWT_SECRET', 'secretKey');
    console.log('--- [DEBUG JWT STRATEGY] ---');
    console.log('SECRET KEY ĐANG SỬ DỤNG:', secret);
    console.log('------------------------------');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // Dùng biến 'secret' ở trên
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    
    // --- DEBUG BƯỚC 2: KIỂM TRA HÀM VALIDATE ---
    console.log('--- [DEBUG JWT STRATEGY] ---');
    console.log('TOKEN HỢP LỆ, PAYLOAD:', payload);
    console.log('------------------------------');

    // ✅ Trả về TOÀN BỘ payload để @CurrentUser() có đủ thông tin
    return {
      sub: payload.sub,
      iat: payload.iat,
      exp: payload.exp,
      email: payload.email,
      employee_id: payload.employee_id,
      employee_code: payload.employee_code, // ✅ THÊM
      full_name: payload.full_name, // ✅ THÊM
      role: payload.role,
      permissions: payload.permissions || [],
      department_id: payload.department_id,
      department_name: payload.department_name, // ✅ THÊM
      position_id: payload.position_id, // ✅ THÊM
      position_name: payload.position_name, // ✅ THÊM
      scope: payload.scope || {},
    };
  }
}