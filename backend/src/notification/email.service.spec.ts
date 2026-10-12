import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailDeliveryError, EmailService } from './email.service';

const API_KEY = 're_test_key';
const SENDER = 'LoanOver <no-reply@loanover.test>';
const MESSAGE = { to: 'ana@example.com', subject: 'Olá', html: '<p>Oi</p>', text: 'Oi' };

const buildService = (env: Record<string, string>): EmailService =>
  new EmailService({ get: (key: string) => env[key] } as unknown as ConfigService);

describe('EmailService', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  describe('when RESEND_API_KEY is configured', () => {
    it('posts the message to the Resend API with a bearer token', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200 });
      const service = buildService({ RESEND_API_KEY: API_KEY, EMAIL_FROM: SENDER });

      await service.send(MESSAGE);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.resend.com/emails');
      expect(init.method).toBe('POST');
      expect(init.headers).toMatchObject({ Authorization: `Bearer ${API_KEY}` });
      expect(JSON.parse(init.body as string)).toEqual({ from: SENDER, ...MESSAGE });
    });

    it('throws a typed error carrying the HTTP status when Resend rejects the request', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 422 });
      const service = buildService({ RESEND_API_KEY: API_KEY, EMAIL_FROM: SENDER });

      const result = service.send(MESSAGE);

      await expect(result).rejects.toBeInstanceOf(EmailDeliveryError);
      await expect(result).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('when RESEND_API_KEY is missing', () => {
    it('logs and returns without calling the network', async () => {
      const service = buildService({});

      await service.send(MESSAGE);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });
  });
});
