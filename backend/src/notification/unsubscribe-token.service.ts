import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export const UNSUBSCRIBE_PURPOSE = 'unsubscribe';
const UNSUBSCRIBE_TOKEN_TTL = '90d';
const UNSUBSCRIBE_PATH = '/notifications/unsubscribe';
const DEFAULT_BACKEND_URL = 'http://localhost:3000';
const INVALID_TOKEN_MESSAGE = 'Invalid unsubscribe token';

interface UnsubscribePayload {
  sub: string;
  purpose?: string;
}

@Injectable()
export class UnsubscribeTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  sign(userId: string): string {
    return this.jwt.sign(
      { sub: userId, purpose: UNSUBSCRIBE_PURPOSE },
      { expiresIn: UNSUBSCRIBE_TOKEN_TTL },
    );
  }

  verify(token: string): string {
    const payload = this.decode(token);
    if (payload.purpose !== UNSUBSCRIBE_PURPOSE) {
      throw new BadRequestException(INVALID_TOKEN_MESSAGE);
    }
    return payload.sub;
  }

  buildUrl(userId: string): string {
    const base = this.config.get<string>('BACKEND_URL') ?? DEFAULT_BACKEND_URL;
    const url = new URL(UNSUBSCRIBE_PATH, base);
    url.searchParams.set('token', this.sign(userId));
    return url.toString();
  }

  private decode(token: string): UnsubscribePayload {
    try {
      return this.jwt.verify<UnsubscribePayload>(token);
    } catch {
      throw new BadRequestException(INVALID_TOKEN_MESSAGE);
    }
  }
}
