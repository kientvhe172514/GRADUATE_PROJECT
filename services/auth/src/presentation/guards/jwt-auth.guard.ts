import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      console.log('JWT Guard: No authorization header');
      throw new UnauthorizedException('Authorization header missing');
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('JWT Guard: No token in authorization header');
      throw new UnauthorizedException('Token missing');
    }
    
    try {
      const payload = this.jwtService.verify(token);
      console.log('JWT Guard: Token verified successfully', { userId: payload.sub, email: payload.email });
      
      // Map JWT payload to user object with id field
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        ...payload
      };
      
      return true;
    } catch (error) {
      console.log('JWT Guard: Token verification failed', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }
}