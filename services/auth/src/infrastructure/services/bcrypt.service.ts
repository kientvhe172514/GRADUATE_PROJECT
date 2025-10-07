import { Injectable } from '@nestjs/common';
import { HashingServicePort } from '../../application/ports/hashing.service.port';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService implements HashingServicePort {
  private readonly saltRounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}