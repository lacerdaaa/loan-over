import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntitlementService, PRO_REQUIRED_MESSAGE } from '../billing/entitlement.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { NotificationPreferencesService } from './notification-preferences.service';

const USER_ID = 'user-1';
const makeUser = (overrides: Partial<User> = {}): User =>
  ({ id: USER_ID, email_notifications: true, monthly_report: false, ...overrides }) as User;

describe('NotificationPreferencesService', () => {
  let userService: { findById: jest.Mock; updateNotificationPreferences: jest.Mock };
  let entitlements: { isPro: jest.Mock };
  let service: NotificationPreferencesService;

  beforeEach(() => {
    userService = { findById: jest.fn(), updateNotificationPreferences: jest.fn() };
    entitlements = { isPro: jest.fn().mockReturnValue(true) };
    service = new NotificationPreferencesService(
      userService as unknown as UserService,
      entitlements as unknown as EntitlementService,
    );
  });

  describe('get', () => {
    it('returns the two preference flags of the user', async () => {
      userService.findById.mockResolvedValue(makeUser({ monthly_report: true }));

      const result = await service.get(USER_ID);

      expect(result).toEqual({ email_notifications: true, monthly_report: true });
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.get(USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      userService.findById.mockResolvedValue(makeUser());
      userService.updateNotificationPreferences.mockImplementation(
        (_id: string, prefs: Partial<User>) => Promise.resolve(makeUser(prefs)),
      );
    });

    it('persists the sent preferences and returns both flags', async () => {
      const result = await service.update(USER_ID, { email_notifications: false });

      expect(userService.updateNotificationPreferences).toHaveBeenCalledWith(USER_ID, {
        email_notifications: false,
      });
      expect(result).toEqual({ email_notifications: false, monthly_report: false });
    });

    it('rejects enabling the monthly report for a user without Pro', async () => {
      entitlements.isPro.mockReturnValue(false);

      const attempt = service.update(USER_ID, { monthly_report: true });

      await expect(attempt).rejects.toThrow(ForbiddenException);
      await expect(attempt).rejects.toThrow(PRO_REQUIRED_MESSAGE);
      expect(userService.updateNotificationPreferences).not.toHaveBeenCalled();
    });

    it('allows disabling the monthly report for a user without Pro', async () => {
      entitlements.isPro.mockReturnValue(false);

      const result = await service.update(USER_ID, { monthly_report: false });

      expect(result.monthly_report).toBe(false);
    });

    it('throws NotFoundException when enabling the report for an unknown user', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.update(USER_ID, { monthly_report: true })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
