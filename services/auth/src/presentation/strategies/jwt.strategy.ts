import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JwtStrategy for Auth Service
 * 
 * Purpose: Validate JWT tokens and extract payload
 * 
 * NOTE: This strategy is ONLY used by Auth Service
 * Other services do NOT verify JWT - they read headers from Ingress
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'secretKey'),
    });
  }

  async validate(payload: any) {
    // Payload is already verified by passport-jwt
    // Just return user info to attach to request
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
    };
  }
}
