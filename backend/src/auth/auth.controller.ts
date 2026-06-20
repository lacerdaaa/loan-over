import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { User } from '../user/user.entity';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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

  @Get('me')
  me(@Req() req: Request): { id: string; email: string; name: string; avatar: string } {
    return req.user as { id: string; email: string; name: string; avatar: string };
  }
}
