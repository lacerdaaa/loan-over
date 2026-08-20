import { Controller, Get, NotFoundException, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AccountType, User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';

const DEV_USER = {
  googleId: 'dev-local',
  email: 'dev@localhost',
  name: 'Dev User',
  avatar: '',
} as const;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth(): void {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const { access_token } = this.authService.login(req.user as User);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }

  @Public()
  @Get('dev-login')
  async devLogin(@Res() res: Response): Promise<void> {
    if (this.config.get<string>('NODE_ENV') !== 'development') {
      throw new NotFoundException();
    }
    const user = await this.authService.findOrCreateUser(
      DEV_USER.googleId,
      DEV_USER.email,
      DEV_USER.name,
      DEV_USER.avatar,
    );
    const { access_token } = this.authService.login(user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }

  @Get('me')
  async me(@Req() req: Request): Promise<{
    id: string;
    email: string;
    name: string;
    avatar: string;
    account_type: AccountType | null;
  }> {
    const { id } = req.user as { id: string };
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      account_type: user.account_type,
    };
  }
}
