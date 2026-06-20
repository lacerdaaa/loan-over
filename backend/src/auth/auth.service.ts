import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateUser(
    googleId: string,
    email: string,
    name: string,
    avatar: string,
  ): Promise<User> {
    const existing = await this.userService.findByGoogleId(googleId);
    if (existing) return existing;
    return this.userService.create({ google_id: googleId, email, name, avatar });
  }

  login(user: User): { access_token: string } {
    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      }),
    };
  }
}
