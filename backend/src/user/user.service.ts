import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ where: { google_id: googleId } });
  }

  create(data: { google_id: string; email: string; name: string; avatar: string }): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }
}
