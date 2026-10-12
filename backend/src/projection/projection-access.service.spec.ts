import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntitlementService, PRO_REQUIRED_MESSAGE } from '../billing/entitlement.service';
import { UserService } from '../user/user.service';
import { FREE_HORIZON_LIMIT, ProjectionAccessService } from './projection-access.service';

describe('ProjectionAccessService', () => {
  let service: ProjectionAccessService;
  let userService: { findById: jest.Mock };
  let entitlements: { isPro: jest.Mock };

  beforeEach(() => {
    userService = { findById: jest.fn().mockResolvedValue({ id: 'user-1' }) };
    entitlements = { isPro: jest.fn().mockReturnValue(false) };
    service = new ProjectionAccessService(
      userService as unknown as UserService,
      entitlements as unknown as EntitlementService,
    );
  });

  describe('assertHorizonAllowed', () => {
    describe('when the user is on the free plan', () => {
      it('allows a horizon up to the free limit', async () => {
        await expect(
          service.assertHorizonAllowed('user-1', FREE_HORIZON_LIMIT),
        ).resolves.toBeUndefined();
      });

      it('forbids a horizon above the free limit', async () => {
        await expect(
          service.assertHorizonAllowed('user-1', FREE_HORIZON_LIMIT + 1),
        ).rejects.toThrow(new ForbiddenException(PRO_REQUIRED_MESSAGE));
      });
    });

    describe('when the user is Pro', () => {
      it('allows a horizon above the free limit', async () => {
        entitlements.isPro.mockReturnValue(true);

        await expect(service.assertHorizonAllowed('user-1', 60)).resolves.toBeUndefined();
      });
    });

    describe('when the horizon is within the free limit', () => {
      it('does not even look the user up', async () => {
        await service.assertHorizonAllowed('user-1', FREE_HORIZON_LIMIT);

        expect(userService.findById).not.toHaveBeenCalled();
      });
    });
  });

  describe('assertSimulatorAllowed', () => {
    it('forbids free users', async () => {
      await expect(service.assertSimulatorAllowed('user-1')).rejects.toThrow(
        new ForbiddenException(PRO_REQUIRED_MESSAGE),
      );
    });

    it('allows Pro users', async () => {
      entitlements.isPro.mockReturnValue(true);

      await expect(service.assertSimulatorAllowed('user-1')).resolves.toBeUndefined();
    });

    it('fails when the user does not exist', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.assertSimulatorAllowed('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
