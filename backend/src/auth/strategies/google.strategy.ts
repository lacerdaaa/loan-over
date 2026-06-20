import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { User } from '../../user/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') ?? 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile): Promise<User> {
    const email = profile.emails?.[0]?.value ?? '';
    const avatar = profile.photos?.[0]?.value ?? '';
    return this.authService.findOrCreateUser(profile.id, email, profile.displayName, avatar);
  }
}
