import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { EmailService } from './email.service';
import { NotificationComposer } from './notification.composer';
import { NotificationService } from './notification.service';
import { UnsubscribeTokenService } from './unsubscribe-token.service';

const USER_ID = 'user-1';
const FRONTEND_URL = 'https://app.example.com';
const UNSUBSCRIBE_URL = 'https://api.example.com/unsub';

describe('NotificationService', () => {
  let userService: { findById: jest.Mock; disableNotifications: jest.Mock };
  let tokens: { verify: jest.Mock; buildUrl: jest.Mock };
  let emailService: { send: jest.Mock };
  let service: NotificationService;

  beforeEach(() => {
    userService = { findById: jest.fn(), disableNotifications: jest.fn() };
    tokens = {
      verify: jest.fn().mockReturnValue(USER_ID),
      buildUrl: jest.fn().mockReturnValue(UNSUBSCRIBE_URL),
    };
    emailService = { send: jest.fn().mockResolvedValue(undefined) };
    service = new NotificationService(
      userService as unknown as UserService,
      tokens as unknown as UnsubscribeTokenService,
      new NotificationComposer(),
      emailService as unknown as EmailService,
      { get: () => FRONTEND_URL } as unknown as ConfigService,
    );
  });

  describe('unsubscribe', () => {
    it('disables notifications of the token owner and returns the frontend confirmation URL', async () => {
      userService.disableNotifications.mockResolvedValue({});

      const url = await service.unsubscribe('token');

      expect(tokens.verify).toHaveBeenCalledWith('token');
      expect(userService.disableNotifications).toHaveBeenCalledWith(USER_ID);
      expect(url).toBe(`${FRONTEND_URL}/unsubscribed`);
    });

    it('propagates the 400 for an invalid token without touching any user', async () => {
      tokens.verify.mockImplementation(() => {
        throw new BadRequestException();
      });

      await expect(service.unsubscribe('bad')).rejects.toThrow(BadRequestException);
      expect(userService.disableNotifications).not.toHaveBeenCalled();
    });
  });

  describe('sendTest', () => {
    it('sends the test email to the address of the user', async () => {
      userService.findById.mockResolvedValue({ id: USER_ID, email: 'a@b.c', name: 'Ana' });

      await service.sendTest(USER_ID);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'a@b.c',
          subject: 'E-mail de teste do LoanOver',
          text: expect.stringContaining(UNSUBSCRIBE_URL) as string,
        }),
      );
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.sendTest(USER_ID)).rejects.toThrow(NotFoundException);
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });
});
