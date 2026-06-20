import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { User } from '../user/user.entity';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({ id: 'uuid-1', google_id: 'gid-1', email: 'test@example.com', name: 'Test User', avatar: '', ...overrides }) as User;

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: { findByGoogleId: jest.fn(), create: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  describe('findOrCreateUser', () => {
    it('returns the existing user when the google_id is already registered', async () => {
      const existing = makeUser();
      userService.findByGoogleId.mockResolvedValue(existing);

      const result = await service.findOrCreateUser('gid-1', 'test@example.com', 'Test User', '');

      expect(userService.create).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('creates a new user when the google_id does not exist yet', async () => {
      const created = makeUser();
      userService.findByGoogleId.mockResolvedValue(null);
      userService.create.mockResolvedValue(created);

      const result = await service.findOrCreateUser('gid-1', 'test@example.com', 'Test User', '');

      expect(userService.create).toHaveBeenCalledWith({
        google_id: 'gid-1',
        email: 'test@example.com',
        name: 'Test User',
        avatar: '',
      });
      expect(result).toBe(created);
    });
  });

  describe('login', () => {
    it('returns a signed JWT with the user id as subject', () => {
      const user = makeUser();
      const { access_token } = service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email, name: user.name, avatar: user.avatar });
      expect(access_token).toBe('signed.jwt.token');
    });
  });
});
