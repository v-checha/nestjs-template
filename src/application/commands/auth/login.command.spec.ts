import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginCommand, LoginCommandHandler } from './login.command';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { TokenProvider } from '@presentation/modules/auth/providers/token.provider';
import { UserMapper } from '@application/mappers/user.mapper';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { User } from '@core/entities/user.entity';
import { Email } from '@core/value-objects/email.vo';
import { FirstName, LastName } from '@core/value-objects/name.vo';
import { Role } from '@core/entities/role.entity';
import { Permission } from '@core/entities/permission.entity';
import { ResourceAction, ActionType } from '@core/value-objects/resource-action.vo';
import { I18nService } from 'nestjs-i18n';
import { LoggerService } from '@infrastructure/logger/logger.service';

// Mock dependencies
const mockUserService = {
  validateCredentials: jest.fn(),
};

const mockAuthService = {
  updateLastLogin: jest.fn(),
  isEmailVerified: jest.fn(),
};

const mockTokenProvider = {
  generateTokens: jest.fn(),
};

const mockRoleRepository = {
  findById: jest.fn(),
};

const mockI18nService = {
  t: jest.fn().mockImplementation(key => {
    const translations = {
      'common.auth.login.failed': 'Invalid credentials',
      'common.auth.verification.email_sent': 'Email verification required',
      'common.auth.2fa.enabled': 'OTP verification required',
      'common.auth.login.success': 'Login successful',
    };

    return translations[key] || key;
  }),
};

// Mock Logger
const mockLoggerService = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

// Create utility functions for test data
const createTestUser = (): User => {
  const user = new User(
    new Email('test@example.com'),
    'hashedPassword',
    new FirstName('John'),
    new LastName('Doe'),
    '550e8400-e29b-41d4-a716-446655440000',
  );

  // Add roles
  const role = new Role('user', 'Regular user role', true);
  role.id = '550e8400-e29b-41d4-a716-446655440001'; // Set ID manually
  user.addRole(role);

  return user;
};

const createRoleWithPermissions = (): Role => {
  const role = new Role('user', 'Regular user role', true);
  role.id = '550e8400-e29b-41d4-a716-446655440001'; // Set ID manually

  // Add permissions
  const resourceAction = new ResourceAction('user', ActionType.READ);
  const permission = new Permission(
    resourceAction,
    'Can read user details',
    '550e8400-e29b-41d4-a716-446655440002',
  );
  role.permissions = [permission];

  return role;
};

describe('LoginCommandHandler', () => {
  let handler: LoginCommandHandler;
  let userService: UserService;
  let authService: AuthService;
  let tokenProvider: TokenProvider;
  let roleRepository: IRoleRepository;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginCommandHandler,
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TokenProvider, useValue: mockTokenProvider },
        { provide: 'RoleRepository', useValue: mockRoleRepository },
        { provide: I18nService, useValue: mockI18nService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    handler = module.get<LoginCommandHandler>(LoginCommandHandler);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    tokenProvider = module.get<TokenProvider>(TokenProvider);
    roleRepository = module.get<IRoleRepository>('RoleRepository');

    // Mock UserMapper if needed
    jest.spyOn(UserMapper, 'toAuthResponse').mockImplementation((user, emailVerified) => {
      return {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName.getValue(),
        lastName: user.lastName.getValue(),
        emailVerified: emailVerified || false,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name,
        })),
      };
    });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'wrongPassword',
    });

    mockUserService.validateCredentials.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UnauthorizedException);
    expect(userService.validateCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'wrongPassword',
    );
  });

  it('should return email verification required response when email is not verified', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const user = createTestUser();
    mockUserService.validateCredentials.mockResolvedValue(user);
    mockAuthService.updateLastLogin.mockResolvedValue(user);
    mockAuthService.isEmailVerified.mockResolvedValue(false);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toEqual({
      requiresEmailVerification: true,
      userId: user.id,
      email: user.email.getValue(),
      message: 'Email verification required',
    });

    expect(userService.validateCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
    );
    expect(authService.updateLastLogin).toHaveBeenCalledWith(user.id);
    expect(authService.isEmailVerified).toHaveBeenCalledWith('test@example.com');
  });

  it('should return OTP required response when user has OTP enabled', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const user = createTestUser();
    user.otpEnabled = true;
    user.otpSecret = 'OTPSECRETBASE32';

    mockUserService.validateCredentials.mockResolvedValue(user);
    mockAuthService.updateLastLogin.mockResolvedValue(user);
    mockAuthService.isEmailVerified.mockResolvedValue(true);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toEqual({
      requiresOtp: true,
      userId: user.id,
      message: 'OTP verification required',
    });

    expect(userService.validateCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
    );
    expect(authService.updateLastLogin).toHaveBeenCalledWith(user.id);
    expect(authService.isEmailVerified).toHaveBeenCalledWith('test@example.com');
  });

  it('should return auth tokens when login is successful', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const user = createTestUser();
    const roleWithPermissions = createRoleWithPermissions();

    mockUserService.validateCredentials.mockResolvedValue(user);
    mockAuthService.updateLastLogin.mockResolvedValue(user);
    mockAuthService.isEmailVerified.mockResolvedValue(true);
    mockRoleRepository.findById.mockResolvedValue(roleWithPermissions);
    mockTokenProvider.generateTokens.mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toEqual({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      message: 'Login successful',
      user: expect.objectContaining({
        id: user.id,
        email: user.email.getValue(),
        emailVerified: true,
      }),
    });

    expect(userService.validateCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password123!',
    );
    expect(authService.updateLastLogin).toHaveBeenCalledWith(user.id);
    expect(authService.isEmailVerified).toHaveBeenCalledWith('test@example.com');
    expect(roleRepository.findById).toHaveBeenCalledWith(user.roles[0].id);
    expect(tokenProvider.generateTokens).toHaveBeenCalledWith(user, ['user:read'], true);
    expect(UserMapper.toAuthResponse).toHaveBeenCalledWith(user, true);
  });

  it('should collect permissions from all user roles', async () => {
    // Arrange
    const command = new LoginCommand({
      email: 'test@example.com',
      password: 'Password123!',
    });

    const user = createTestUser();

    // Add another role to the user
    const adminRole = new Role('admin', 'Administrator role', false);
    adminRole.id = '550e8400-e29b-41d4-a716-446655440003'; // Set ID manually
    user.addRole(adminRole);

    // Create roles with permissions for repository responses
    const userRoleWithPermissions = createRoleWithPermissions();

    const adminRoleWithPermissions = new Role('admin', 'Administrator role', false);
    adminRoleWithPermissions.id = '550e8400-e29b-41d4-a716-446655440003'; // Set ID manually
    const adminResourceAction = new ResourceAction('user', ActionType.WRITE);
    const adminPermission = new Permission(
      adminResourceAction,
      'Can write user details',
      '550e8400-e29b-41d4-a716-446655440004',
    );
    adminRoleWithPermissions.permissions = [adminPermission];

    mockUserService.validateCredentials.mockResolvedValue(user);
    mockAuthService.updateLastLogin.mockResolvedValue(user);
    mockAuthService.isEmailVerified.mockResolvedValue(true);

    // Mock repository to return different roles based on role id
    mockRoleRepository.findById.mockImplementation(roleId => {
      if (roleId === '550e8400-e29b-41d4-a716-446655440001') {
        return Promise.resolve(userRoleWithPermissions);
      } else if (roleId === '550e8400-e29b-41d4-a716-446655440003') {
        return Promise.resolve(adminRoleWithPermissions);
      }

      return Promise.resolve(null);
    });

    mockTokenProvider.generateTokens.mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    // Act
    await handler.execute(command);

    // Assert
    // Check that permissions from both roles are included
    expect(tokenProvider.generateTokens).toHaveBeenCalledWith(
      user,
      expect.arrayContaining(['user:read', 'user:write']),
      true,
    );

    // Also check that roleRepository.findById was called for both roles
    expect(roleRepository.findById).toHaveBeenCalledTimes(2);
    expect(roleRepository.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
    expect(roleRepository.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440003');
  });
});
