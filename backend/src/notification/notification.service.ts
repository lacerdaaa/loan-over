import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { EmailService } from './email.service';
import { NotificationComposer } from './notification.composer';
import { UnsubscribeTokenService } from './unsubscribe-token.service';

const UNSUBSCRIBED_PATH = '/unsubscribed';
const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

@Injectable()
export class NotificationService {
  constructor(
    private readonly userService: UserService,
    private readonly tokens: UnsubscribeTokenService,
    private readonly composer: NotificationComposer,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async unsubscribe(token: string): Promise<string> {
    const userId = this.tokens.verify(token);
    await this.userService.disableNotifications(userId);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? DEFAULT_FRONTEND_URL;
    return `${frontendUrl}${UNSUBSCRIBED_PATH}`;
  }

  async sendTest(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    const email = this.composer.composeTest({
      userName: user.name,
      unsubscribeUrl: this.tokens.buildUrl(user.id),
    });
    await this.emailService.send({ to: user.email, ...email });
  }
}
