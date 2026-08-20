import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Response } from 'express';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'uuid-1',
    google_id: 'dev-local',
    email: 'dev@localhost',
    name: 'Dev User',
    avatar: '',
    ...overrides,
  }) as User;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let config: jest.Mocked<ConfigService>;
  let res: jest.Mocked<Pick<Response, 'redirect'>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            findOrCreateUser: jest.fn(),
            login: jest.fn().mockReturnValue({ access_token: 'signed.jwt.token' }),
          },
        },
        {
          provide: UserService,
          useValue: { findById: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
    config = module.get(ConfigService);
    res = { redirect: jest.fn() };
  });

  describe('devLogin', () => {
    describe('when NODE_ENV is development', () => {
      it('logs in a local dev user and redirects with a token', async () => {
        const user = makeUser();
        authService.findOrCreateUser.mockResolvedValue(user);
        config.get.mockImplementation((key: string) =>
          key === 'NODE_ENV' ? 'development' : undefined,
        );

        await controller.devLogin(res as unknown as Response);

        expect(authService.findOrCreateUser).toHaveBeenCalledWith(
          'dev-local',
          'dev@localhost',
          'Dev User',
          '',
        );
        expect(authService.login).toHaveBeenCalledWith(user);
        expect(res.redirect).toHaveBeenCalledWith(
          'http://localhost:5173/auth/callback?token=signed.jwt.token',
        );
      });
    });

    describe('when NODE_ENV is production', () => {
      it('throws NotFoundException and never issues a token', async () => {
        config.get.mockImplementation((key: string) =>
          key === 'NODE_ENV' ? 'production' : undefined,
        );

        await expect(controller.devLogin(res as unknown as Response)).rejects.toThrow(
          NotFoundException,
        );

        expect(authService.findOrCreateUser).not.toHaveBeenCalled();
        expect(res.redirect).not.toHaveBeenCalled();
      });
    });

    describe('when NODE_ENV is unset', () => {
      it('throws NotFoundException (fail-closed)', async () => {
        config.get.mockImplementation(() => undefined);

        await expect(controller.devLogin(res as unknown as Response)).rejects.toThrow(
          NotFoundException,
        );

        expect(authService.findOrCreateUser).not.toHaveBeenCalled();
      });
    });
  });
});
