import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntitlementService, PRO_REQUIRED_MESSAGE } from '../billing/entitlement.service';
import { UserService } from '../user/user.service';

export const FREE_HORIZON_LIMIT = 24;

@Injectable()
export class ProjectionAccessService {
  constructor(
    private readonly userService: UserService,
    private readonly entitlements: EntitlementService,
  ) {}

  async assertHorizonAllowed(userId: string, horizon: number): Promise<void> {
    if (horizon <= FREE_HORIZON_LIMIT) return;
    await this.assertSimulatorAllowed(userId);
  }

  async assertSimulatorAllowed(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (!this.entitlements.isPro(user)) throw new ForbiddenException(PRO_REQUIRED_MESSAGE);
  }
}
