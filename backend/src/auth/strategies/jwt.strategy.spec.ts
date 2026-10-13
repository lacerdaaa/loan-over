import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy({ getOrThrow: () => 'secret' } as unknown as ConfigService);

  describe('when the token is a regular session token', () => {
    it('exposes the user identity', () => {
      const user = strategy.validate({ sub: 'u1', email: 'a@b.c', name: 'A', avatar: '' });

      expect(user).toEqual({ id: 'u1', email: 'a@b.c', name: 'A', avatar: '' });
    });
  });

  describe('when the token was issued for a single purpose', () => {
    it('refuses to authenticate a session with it', () => {
      expect(() =>
        strategy.validate({
          sub: 'u1',
          email: 'a@b.c',
          name: 'A',
          avatar: '',
          purpose: 'unsubscribe',
        }),
      ).toThrow(UnauthorizedException);
    });
  });
});
