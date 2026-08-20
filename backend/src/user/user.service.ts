import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountType, User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ where: { google_id: googleId } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: { google_id: string; email: string; name: string; avatar: string }): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async setAccountType(id: string, accountType: AccountType): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.account_type = accountType;
    return this.repo.save(user);
  }
}
