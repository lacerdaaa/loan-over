import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BusinessFeatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (this.config.get<string>('FEATURE_BUSINESS') === 'true') return true;
    throw new NotFoundException();
  }
}
