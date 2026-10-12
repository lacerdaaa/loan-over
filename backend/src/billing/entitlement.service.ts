import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';

export const PRO_REQUIRED_MESSAGE = 'Recurso disponível no plano Pro';

@Injectable()
export class EntitlementService {
  constructor(private readonly config: ConfigService) {}

  isPro(_user: User): boolean {
    return this.config.get<string>('FEATURE_BILLING') !== 'true';
  }
}
