import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnsubscribeTokenService } from './unsubscribe-token.service';

const SECRET = 'unit-test-secret';
const USER_ID = 'user-1';
const BACKEND_URL = 'https://api.example.com';
const NINETY_DAYS_IN_SECONDS = 90 * 24 * 60 * 60;

describe('UnsubscribeTokenService', () => {
  const jwt = new JwtService({ secret: SECRET });
  const config = {
    get: (key: string) => (key === 'BACKEND_URL' ? BACKEND_URL : undefined),
  } as unknown as ConfigService;
  const service = new UnsubscribeTokenService(jwt, config);

  describe('sign', () => {
    it('issues a token for the unsubscribe purpose that lasts 90 days', () => {
      const token = service.sign(USER_ID);

      const payload = jwt.verify<{ sub: string; purpose: string; iat: number; exp: number }>(token);
      expect(payload.sub).toBe(USER_ID);
      expect(payload.purpose).toBe('unsubscribe');
      expect(payload.exp - payload.iat).toBe(NINETY_DAYS_IN_SECONDS);
    });
  });

  describe('verify', () => {
    it('returns the user id of a valid token', () => {
      expect(service.verify(service.sign(USER_ID))).toBe(USER_ID);
    });

    it('rejects a token that is not a JWT', () => {
      expect(() => service.verify('garbage')).toThrow(BadRequestException);
    });

    it('rejects a token signed with another secret', () => {
      const foreign = new JwtService({ secret: 'other' }).sign({
        sub: USER_ID,
        purpose: 'unsubscribe',
      });

      expect(() => service.verify(foreign)).toThrow(BadRequestException);
    });

    it('rejects a session token that lacks the unsubscribe purpose', () => {
      const session = jwt.sign({ sub: USER_ID, email: 'a@b.c' });

      expect(() => service.verify(session)).toThrow(BadRequestException);
    });
  });

  describe('buildUrl', () => {
    it('points to the public unsubscribe endpoint with a fresh token', () => {
      const url = new URL(service.buildUrl(USER_ID));

      expect(url.origin).toBe(BACKEND_URL);
      expect(url.pathname).toBe('/notifications/unsubscribe');
      expect(service.verify(url.searchParams.get('token') ?? '')).toBe(USER_ID);
    });
  });
});
