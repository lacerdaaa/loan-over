import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessFeatureGuard } from './business-feature.guard';

const makeContext = (): ExecutionContext => ({}) as ExecutionContext;

const makeGuard = (flag: string | undefined): BusinessFeatureGuard => {
  const config = { get: jest.fn().mockReturnValue(flag) } as unknown as ConfigService;
  return new BusinessFeatureGuard(config);
};

describe('BusinessFeatureGuard', () => {
  describe('when FEATURE_BUSINESS is "true"', () => {
    it('allows the request through', () => {
      const guard = makeGuard('true');

      expect(guard.canActivate(makeContext())).toBe(true);
    });
  });

  describe('when FEATURE_BUSINESS is "false"', () => {
    it('hides the endpoint by throwing NotFoundException', () => {
      const guard = makeGuard('false');

      expect(() => guard.canActivate(makeContext())).toThrow(NotFoundException);
    });
  });

  describe('when FEATURE_BUSINESS is unset', () => {
    it('hides the endpoint by throwing NotFoundException', () => {
      const guard = makeGuard(undefined);

      expect(() => guard.canActivate(makeContext())).toThrow(NotFoundException);
    });
  });
});
