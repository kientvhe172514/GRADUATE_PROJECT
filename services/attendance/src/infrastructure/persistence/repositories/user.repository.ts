import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepositoryPort } from '../../../application/ports/user.repository.port';
import { User } from '../../../domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
  ) {
    console.log('UserRepository: Initialized, repo:', this.repo); // Debug
    if (!this.repo) {
      console.error('UserRepository: Failed to inject repo');
    }
    this.seedData();
  }

  private async seedData() {
    const count = await this.repo.count();
    if (count === 0) {
      const user = this.repo.create({
        username: 'teacher123',
        passwordHash: await bcrypt.hash('pass123', 10),
        role: 'teacher',
      });
      await this.repo.save(user);

      const admin = this.repo.create({
        username: 'admin123',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
      });
      await this.repo.save(admin);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    const userEntity = await this.repo.findOne({ where: { username } });
    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }
}