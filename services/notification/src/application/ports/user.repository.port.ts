import { User } from '../../domain/entities/user.entity';

export interface UserRepositoryPort {
  findByUsername(username: string): Promise<User | null>;
}