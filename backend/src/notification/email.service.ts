import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailDeliveryError extends Error {
  constructor(readonly status: number) {
    super(`Email provider responded with status ${status}`);
    this.name = 'EmailDeliveryError';
  }
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(`RESEND_API_KEY not set; skipping email "${message.subject}"`);
      return;
    }

    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.config.get<string>('EMAIL_FROM'), ...message }),
    });
    if (!response.ok) throw new EmailDeliveryError(response.status);
  }
}
