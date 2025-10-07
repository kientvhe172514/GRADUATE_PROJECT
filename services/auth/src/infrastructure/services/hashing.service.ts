// File Path: src/infrastructure/services/hashing.service.ts
import { Injectable } from '@nestjs/common';
import { HashingServicePort } from '../../application/ports/hashing.service.port';

@Injectable()
export abstract class HashingService implements HashingServicePort {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}
